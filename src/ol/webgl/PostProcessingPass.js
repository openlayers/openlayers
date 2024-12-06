/**
 * @module ol/webgl/PostProcessingPass
 */

import {getUid} from '../util.js';

const DEFAULT_VERTEX_SHADER = `
  precision mediump float;

  attribute vec2 a_position;
  varying vec2 v_texCoord;
  varying vec2 v_screenCoord;

  uniform vec2 u_screenSize;

  void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    v_screenCoord = v_texCoord * u_screenSize;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const DEFAULT_FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_image;
  uniform float u_opacity;

  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord) * u_opacity;
  }
`;

/**
 * @typedef {Object} Options
 * @property {WebGLRenderingContext} webGlContext WebGL context; mandatory.
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas that will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object<string,import("./Helper").UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} UniformInternalDescription
 * @property {import("./Helper").UniformValue} value Value
 * @property {WebGLUniformLocation} location Location
 * @property {WebGLTexture} [texture] Texture
 * @private
 */

/**
 * @classdesc
 * This class is used to define Post Processing passes with custom shaders and uniforms.
 * This is used internally by {@link module:ol/webgl/Helper~WebGLHelper}.
 *
 * Please note that the final output on the DOM canvas is expected to have premultiplied alpha, which means that
 * a pixel which is 100% red with an opacity of 50% must have a color of (r=0.5, g=0, b=0, a=0.5).
 * Failing to provide pixel colors with premultiplied alpha will result in render anomalies.
 *
 * The default post-processing pass does *not* multiply color values with alpha value, it expects color values to be
 * premultiplied.
 *
 * Default shaders are shown hereafter:
 *
 * Vertex shader:
 *
 *   ```
 *   precision mediump float;
 *
 *   attribute vec2 a_position;
 *   varying vec2 v_texCoord;
 *   varying vec2 v_screenCoord;
 *
 *   uniform vec2 u_screenSize;
 *
 *   void main() {
 *     v_texCoord = a_position * 0.5 + 0.5;
 *     v_screenCoord = v_texCoord * u_screenSize;
 *     gl_Position = vec4(a_position, 0.0, 1.0);
 *   }
 *   ```
 *
 * Fragment shader:
 *
 *   ```
 *   precision mediump float;
 *
 *   uniform sampler2D u_image;
 *   uniform float u_opacity;
 *
 *   varying vec2 v_texCoord;
 *
 *   void main() {
 *     gl_FragColor = texture2D(u_image, v_texCoord) * u_opacity;
 *   }
 *   ```
 */
class WebGLPostProcessingPass {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    /**
     * @private
     */
    this.gl_ = options.webGlContext;
    const gl = this.gl_;

    /**
     * @private
     */
    this.scaleRatio_ = options.scaleRatio || 1;

    /**
     * @type {WebGLTexture}
     * @private
     */
    this.renderTargetTexture_ = gl.createTexture();

    /**
     * @type {import('../size.js').Size|null}
     * @private
     */
    this.renderTargetTextureSize_ = null;

    /**
     * @private
     */
    this.frameBuffer_ = gl.createFramebuffer();
    /**
     * @private
     */
    this.depthBuffer_ = gl.createRenderbuffer();

    // compile the program for the frame buffer
    // TODO: make compilation errors show up
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vertexShader,
      options.vertexShader || DEFAULT_VERTEX_SHADER,
    );
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      fragmentShader,
      options.fragmentShader || DEFAULT_FRAGMENT_SHADER,
    );
    gl.compileShader(fragmentShader);
    /**
     * @private
     */
    this.renderTargetProgram_ = gl.createProgram();
    gl.attachShader(this.renderTargetProgram_, vertexShader);
    gl.attachShader(this.renderTargetProgram_, fragmentShader);
    gl.linkProgram(this.renderTargetProgram_);

    // bind the vertices buffer for the frame buffer
    /**
     * @private
     */
    this.renderTargetVerticesBuffer_ = gl.createBuffer();
    const verticesArray = [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(verticesArray),
      gl.STATIC_DRAW,
    );

    /**
     * @private
     */
    this.renderTargetAttribLocation_ = gl.getAttribLocation(
      this.renderTargetProgram_,
      'a_position',
    );
    /**
     * @private
     */
    this.renderTargetUniformLocation_ = gl.getUniformLocation(
      this.renderTargetProgram_,
      'u_screenSize',
    );
    /**
     * @private
     */
    this.renderTargetOpacityLocation_ = gl.getUniformLocation(
      this.renderTargetProgram_,
      'u_opacity',
    );
    /**
     * @private
     */
    this.renderTargetTextureLocation_ = gl.getUniformLocation(
      this.renderTargetProgram_,
      'u_image',
    );

    /**
     * Holds info about custom uniforms used in the post processing pass
     * @type {Array<UniformInternalDescription>}
     * @private
     */
    this.uniforms_ = [];
    options.uniforms &&
      Object.keys(options.uniforms).forEach((name) => {
        this.uniforms_.push({
          value: options.uniforms[name],
          location: gl.getUniformLocation(this.renderTargetProgram_, name),
        });
      });
  }

  getRenderTargetTexture() {
    return this.renderTargetTexture_;
  }

  /**
   * Get the WebGL rendering context
   * @return {WebGLRenderingContext} The rendering context.
   */
  getGL() {
    return this.gl_;
  }

  /**
   * Initialize the render target texture of the post process, make sure it is at the
   * right size and bind it as a render target for the next draw calls.
   * The last step to be initialized will be the one where the primitives are rendered.
   * @param {import("../Map.js").FrameState} frameState current frame state
   */
  init(frameState) {
    const gl = this.getGL();
    const textureSize = [
      gl.drawingBufferWidth * this.scaleRatio_,
      gl.drawingBufferHeight * this.scaleRatio_,
    ];

    // rendering goes to my buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.getFrameBuffer());
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.getDepthBuffer());
    gl.viewport(0, 0, textureSize[0], textureSize[1]);

    // if size has changed: adjust canvas & render target texture
    if (
      !this.renderTargetTextureSize_ ||
      this.renderTargetTextureSize_[0] !== textureSize[0] ||
      this.renderTargetTextureSize_[1] !== textureSize[1]
    ) {
      this.renderTargetTextureSize_ = textureSize;

      // create a new texture
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        textureSize[0],
        textureSize[1],
        border,
        format,
        type,
        data,
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // bind the texture to the framebuffer
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.renderTargetTexture_,
        0,
      );

      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        textureSize[0],
        textureSize[1],
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        this.depthBuffer_,
      );
    }
  }

  /**
   * Render to the next postprocessing pass (or to the canvas if final pass).
   * @param {import("../Map.js").FrameState} frameState current frame state
   * @param {WebGLPostProcessingPass} [nextPass] Next pass, optional
   * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [preCompose] Called before composing.
   * @param {function(WebGLRenderingContext, import("../Map.js").FrameState):void} [postCompose] Called before composing.
   */
  apply(frameState, nextPass, preCompose, postCompose) {
    const gl = this.getGL();
    const size = frameState.size;

    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      nextPass ? nextPass.getFrameBuffer() : null,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);

    if (!nextPass) {
      // clear the canvas if we are the first to render to it
      // and preserveDrawingBuffer is true
      const canvasId = getUid(gl.canvas);
      if (!frameState.renderTargets[canvasId]) {
        const attributes = gl.getContextAttributes();
        if (attributes && attributes.preserveDrawingBuffer) {
          gl.clearColor(0.0, 0.0, 0.0, 0.0);
          gl.clearDepth(1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        frameState.renderTargets[canvasId] = true;
      }
    }

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);

    gl.useProgram(this.renderTargetProgram_);
    gl.enableVertexAttribArray(this.renderTargetAttribLocation_);
    gl.vertexAttribPointer(
      this.renderTargetAttribLocation_,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.uniform2f(this.renderTargetUniformLocation_, size[0], size[1]);
    gl.uniform1i(this.renderTargetTextureLocation_, 0);

    const opacity = frameState.layerStatesArray[frameState.layerIndex].opacity;
    gl.uniform1f(this.renderTargetOpacityLocation_, opacity);

    this.applyUniforms(frameState);

    if (preCompose) {
      preCompose(gl, frameState);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (postCompose) {
      postCompose(gl, frameState);
    }
  }

  /**
   * @return {WebGLFramebuffer} Frame buffer
   */
  getFrameBuffer() {
    return this.frameBuffer_;
  }

  /**
   * @return {WebGLRenderbuffer} Depth buffer
   */
  getDepthBuffer() {
    return this.depthBuffer_;
  }

  /**
   * Sets the custom uniforms based on what was given in the constructor.
   * @param {import("../Map.js").FrameState} frameState Frame state.
   * @private
   */
  applyUniforms(frameState) {
    const gl = this.getGL();

    let value;
    let textureSlot = 1;
    this.uniforms_.forEach(function (uniform) {
      value =
        typeof uniform.value === 'function'
          ? uniform.value(frameState)
          : uniform.value;

      // apply value based on type
      if (value instanceof HTMLCanvasElement || value instanceof ImageData) {
        // create a texture & put data
        if (!uniform.texture) {
          uniform.texture = gl.createTexture();
        }
        gl.activeTexture(gl[`TEXTURE${textureSlot}`]);
        gl.bindTexture(gl.TEXTURE_2D, uniform.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (value instanceof ImageData) {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            value.width,
            value.height,
            0,
            gl.UNSIGNED_BYTE,
            new Uint8Array(value.data),
          );
        } else {
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            value,
          );
        }

        // fill texture slots
        gl.uniform1i(uniform.location, textureSlot++);
      } else if (Array.isArray(value)) {
        switch (value.length) {
          case 2:
            gl.uniform2f(uniform.location, value[0], value[1]);
            return;
          case 3:
            gl.uniform3f(uniform.location, value[0], value[1], value[2]);
            return;
          case 4:
            gl.uniform4f(
              uniform.location,
              value[0],
              value[1],
              value[2],
              value[3],
            );
            return;
          default:
            return;
        }
      } else if (typeof value === 'number') {
        gl.uniform1f(uniform.location, value);
      }
    });
  }
}

export default WebGLPostProcessingPass;
