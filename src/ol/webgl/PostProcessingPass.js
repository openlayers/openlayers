/**
 * @module ol/webgl/PostProcessingPass
 */

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
   
  varying vec2 v_texCoord;
  varying vec2 v_screenCoord;
   
  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

class WebGLPostProcessingPass {

  /**
   * // todo
   */
  constructor(options) {
    this.gl_ = options.webGlContext;
    const gl = this.gl_;

    this.scaleRatio_ = options.scaleRatio || 1;

    this.renderTargetTexture_ = gl.createTexture();
    this.renderTargetTextureSize_ = null;

    this.frameBuffer_ = gl.createFramebuffer();

    // compile the program for the frame buffer
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, options.vertexShader || DEFAULT_VERTEX_SHADER);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(`Shader compilation failed - log:\n${gl.getShaderInfoLog(vertexShader)}`);
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, options.fragmentShader || DEFAULT_FRAGMENT_SHADER);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(`Shader compilation failed - log:\n${gl.getShaderInfoLog(fragmentShader)}`);
    }
    this.renderTargetProgram_ = gl.createProgram();
    gl.attachShader(this.renderTargetProgram_, vertexShader);
    gl.attachShader(this.renderTargetProgram_, fragmentShader);
    gl.linkProgram(this.renderTargetProgram_);

    // bind the vertices buffer for the frame buffer
    this.renderTargetVerticesBuffer_ = gl.createBuffer();
    const verticesArray = [
      -1, -1,
      1, -1,
      -1, 1,
      1, -1,
      1, 1,
      -1, 1
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);

    this.renderTargetAttribLocation_ = gl.getAttribLocation(this.renderTargetProgram_, 'a_position');
    this.renderTargetUniformLocation_ = gl.getUniformLocation(this.renderTargetProgram_, 'u_screenSize');
    this.renderTargetTextureLocation_ = gl.getUniformLocation(this.renderTargetProgram_, 'u_image');

    /**
     * Holds info about custom uniforms used in the post processing pass
     * @type {Array<{value: *, location: WebGLUniformLocation, texture?: WebGLTexture}>}
     * @private
     */
    this.uniforms_ = [];
    options.uniforms && Object.keys(options.uniforms).forEach(function(name) {
      this.uniforms_.push({
        value: options.uniforms[name],
        location: gl.getUniformLocation(this.renderTargetProgram_, name)
      });
    }.bind(this));
  }

  /**
   * Get the WebGL rendering context
   * @return {WebGLRenderingContext} The rendering context.
   * @api
   */
  getGL() {
    return this.gl_;
  }

  // todo
  // the last postprocess initialized will be the one where the primitives are drawn
  init(size) {
    const gl = this.getGL();
    const canvas = gl.canvas;

    // rendering goes to my buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.getFrameBuffer());
    gl.viewport(0, 0, canvas.width * this.scaleRatio_, canvas.height * this.scaleRatio_);

    // if size has changed: adjust canvas & render target texture
    if (!this.renderTargetTextureSize_ ||
      this.renderTargetTextureSize_[0] !== size[0] || this.renderTargetTextureSize_[1] !== size[1]) {
      this.renderTargetTextureSize_ = size;

      // create a new texture
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        canvas.width * this.scaleRatio_, canvas.height * this.scaleRatio_, border,
        format, type, data);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // bind the texture to the framebuffer
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTargetTexture_, 0);
    }
  }

  // todo
  // render to the next postprocessing pass (or to the canvas if final pass)
  apply(nextPass) {
    const gl = this.getGL();
    const canvas = gl.canvas;

    gl.bindFramebuffer(gl.FRAMEBUFFER, nextPass ? nextPass.getFrameBuffer() : null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);

    // render the frame buffer to the canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);

    gl.useProgram(this.renderTargetProgram_);
    gl.enableVertexAttribArray(this.renderTargetAttribLocation_);
    gl.vertexAttribPointer(this.renderTargetAttribLocation_, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.renderTargetUniformLocation_, canvas.width, canvas.height);
    gl.uniform1i(this.renderTargetTextureLocation_, 0);

    this.applyUniforms();

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // todo
  getFrameBuffer() {
    return this.frameBuffer_;
  }

  // todo
  applyUniforms() {
    const gl = this.getGL();

    let value;
    let textureSlot = 1;
    this.uniforms_.forEach(function(uniform) {
      value = typeof uniform.value === 'function' ? uniform.value() : uniform.value;

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
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, value.width, value.height, 0,
            gl.UNSIGNED_BYTE, new Uint8Array(value.data));
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, value);
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
            gl.uniform4f(uniform.location, value[0], value[1], value[2], value[3]);
            return;
        }
      } else if (typeof value === 'number') {
        gl.uniform1f(uniform.location, value);
      }
    });
  }
}

export default WebGLPostProcessingPass;
