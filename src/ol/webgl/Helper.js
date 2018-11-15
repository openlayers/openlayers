/**
 * @module ol/webgl/Helper
 */
import {getUid} from '../util.js';
import {EXTENSIONS as WEBGL_EXTENSIONS} from '../webgl.js';
import Disposable from '../Disposable.js';
import {includes} from '../array.js';
import {listen, unlistenAll} from '../events.js';
import {clear} from '../obj.js';
import {ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, TEXTURE_2D, TEXTURE_WRAP_S, TEXTURE_WRAP_T} from '../webgl.js';
import ContextEventType from '../webgl/ContextEventType.js';
import {
  create as createTransform,
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform
} from "../transform";
import {create, fromTransform} from "../vec/mat4";
import WebGLBuffer from "./Buffer";
import WebGLVertex from "./Vertex";
import WebGLFragment from "./Fragment";


/**
 * @typedef {Object} BufferCacheEntry
 * @property {import("./Buffer.js").default} buf
 * @property {WebGLBuffer} buffer
 */

export const DefaultUniform = {
  PROJECTION_MATRIX: 'u_projectionMatrix',
  OFFSET_SCALE_MATRIX: 'u_offsetScaleMatrix',
  OFFSET_ROTATION_MATRIX: 'u_offsetRotateMatrix',
  OPACITY: 'u_opacity'
};

export const DefaultAttrib = {
  POSITION: 'a_position',
  TEX_COORD: 'a_texCoord',
  OPACITY: 'a_opacity',
  ROTATE_WITH_VIEW: 'a_rotateWithView',
  OFFSETS: 'a_offsets'
};

const FRAMEBUFFER_VERTEX_SHADER = `
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

const FRAMEBUFFER_FRAGMENT_SHADER = `
  precision mediump float;
   
  uniform sampler2D u_image;
   
  varying vec2 v_texCoord;
  varying vec2 v_screenCoord;
   
  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

/**
 * @classdesc
 * A WebGL context for accessing low-level WebGL capabilities.
 * Will handle attributes, uniforms, buffers, textures, frame buffers.
 * The context will always render to a frame buffer in order to allow post-processing.
 */
class WebGLHelper extends Disposable {

  /**
   */
  constructor(opt_options) {
    super();
    const options = opt_options || {};

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = document.createElement('canvas');
    this.canvas_.style.position = 'absolute';


    /**
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl_ = this.canvas_.getContext('webgl');

    /**
     * @private
     * @type {!Object<string, BufferCacheEntry>}
     */
    this.bufferCache_ = {};

    /**
     * @private
     * @type {!Object<string, WebGLShader>}
     */
    this.shaderCache_ = {};

    /**
     * @private
     * @type {!Object<string, WebGLProgram>}
     */
    this.programCache_ = {};

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.currentProgram_ = null;

    /**
     * @type {boolean}
     */
    this.hasOESElementIndexUint = includes(WEBGL_EXTENSIONS, 'OES_element_index_uint');

    // use the OES_element_index_uint extension if available
    if (this.hasOESElementIndexUint) {
      this.gl_.getExtension('OES_element_index_uint');
    }

    listen(this.canvas_, ContextEventType.LOST,
      this.handleWebGLContextLost, this);
    listen(this.canvas_, ContextEventType.RESTORED,
      this.handleWebGLContextRestored, this);

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.projectionMatrix_ = createTransform();

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.offsetRotateMatrix_ = createTransform();

    /**
     * @private
     * @type {import("../transform.js").Transform}
     */
    this.offsetScaleMatrix_ = createTransform();

    /**
     * @private
     * @type {Array<number>}
     */
    this.tmpMat4_ = create();

    /**
     * @private
     * @type {Object.<string, WebGLUniformLocation>}
     */
    this.uniformLocations_;

    /**
     * @private
     * @type {Object.<string, number>}
     */
    this.attribLocations_;


    const gl = this.getGL();

    this.renderTargetTexture_ = gl.createTexture();
    this.renderTargetTextureSize_ = null;

    this.frameBuffer_ = gl.createFramebuffer();


    // compile the program for the frame buffer
    const vertexShader = new WebGLVertex(FRAMEBUFFER_VERTEX_SHADER);
    const fragmentShader = new WebGLFragment(options.postProcessingShader || FRAMEBUFFER_FRAGMENT_SHADER);
    this.renderTargetProgram_ = this.getProgram(fragmentShader, vertexShader);

    // bind the vertices buffer for the frame buffer
    this.renderTargetVerticesBuffer_ = new WebGLBuffer([
      -1, -1,
      1, -1,
      -1, 1,
      1, -1,
      1, 1,
      -1, 1
    ], gl.STATIC_DRAW);

    this.renderTargetAttribLocation_ = gl.getAttribLocation(this.renderTargetProgram_, 'a_position');
    this.renderTargetUniformLocation_ = gl.getUniformLocation(this.renderTargetProgram_, 'u_screenSize');
    this.renderTargetTextureLocation_ = gl.getUniformLocation(this.renderTargetProgram_, 'u_image');
  }

  /**
   * Just bind the buffer if it's in the cache. Otherwise create
   * the WebGL buffer, bind it, populate it, and add an entry to
   * the cache.
   * TODO: improve this, the logic is unclear: we want A/ to bind a buffer and B/ to flush data in it
   * @param {number} target Target.
   * @param {WebGLBuffer} buf Buffer.
   */
  bindBuffer(target, buf) {
    const gl = this.getGL();
    const arr = buf.getArray();
    const bufferKey = getUid(buf);
    let bufferCache = this.bufferCache_[bufferKey];
    if (!bufferCache) {
      const buffer = gl.createBuffer();
      bufferCache = this.bufferCache_[bufferKey] = {
        buf: buf,
        buffer: buffer
      };
    }
    gl.bindBuffer(target, bufferCache.buffer);
    let /** @type {ArrayBufferView} */ arrayBuffer;
    if (target == ARRAY_BUFFER) {
      arrayBuffer = new Float32Array(arr);
    } else if (target == ELEMENT_ARRAY_BUFFER) {
      arrayBuffer = this.hasOESElementIndexUint ?
        new Uint32Array(arr) : new Uint16Array(arr);
    }
    gl.bufferData(target, arrayBuffer, buf.getUsage());
  }

  /**
   * @param {import("./Buffer.js").default} buf Buffer.
   */
  deleteBuffer(buf) {
    const gl = this.getGL();
    const bufferKey = getUid(buf);
    const bufferCacheEntry = this.bufferCache_[bufferKey];
    if (!gl.isContextLost()) {
      gl.deleteBuffer(bufferCacheEntry.buffer);
    }
    delete this.bufferCache_[bufferKey];
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    unlistenAll(this.canvas_);
    const gl = this.getGL();
    if (!gl.isContextLost()) {
      for (const key in this.bufferCache_) {
        gl.deleteBuffer(this.bufferCache_[key].buffer);
      }
      for (const key in this.programCache_) {
        gl.deleteProgram(this.programCache_[key]);
      }
      for (const key in this.shaderCache_) {
        gl.deleteShader(this.shaderCache_[key]);
      }
    }
  }

  /**
   * Clear the buffer & set the viewport to draw
   */
  prepareDraw(size, pixelRatio) {
    const gl = this.getGL();
    const canvas = this.getCanvas();

    gl.useProgram(this.currentProgram_);

    // the initial rendering is done on the buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer_);

    // if size has changed: adjust canvas & render target texture
    if (!this.renderTargetTextureSize_ ||
      this.renderTargetTextureSize_[0] !== size[0] || this.renderTargetTextureSize_[1] !== size[1]) {
      this.renderTargetTextureSize_ = size;

      canvas.width = size[0] * pixelRatio;
      canvas.height = size[1] * pixelRatio;
      canvas.style.width = size[0] + 'px';
      canvas.style.height = size[1] + 'px';

      // create a new texture
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        canvas.width, canvas.height, border,
        format, type, data);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // bind the texture to the framebuffer
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTargetTexture_, 0);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /**
   * @protected
   * @param {number} start Start index.
   * @param {number} end End index.
   */
  drawElements(start, end) {
    const gl = this.getGL();
    const elementType = this.hasOESElementIndexUint ?
      gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    const elementSize = this.hasOESElementIndexUint ? 4 : 2;

    const numItems = end - start;
    const offsetInBytes = start * elementSize;
    gl.drawElements(gl.TRIANGLES, numItems, elementType, offsetInBytes);
  }

  /**
   * Copy the frame buffer to the canvas
   */
  finalizeDraw() {
    const gl = this.getGL();
    const canvas = this.getCanvas();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.renderTargetTexture_);

    // render the frame buffer to the canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);

    this.bindBuffer(gl.ARRAY_BUFFER, this.renderTargetVerticesBuffer_);

    gl.useProgram(this.renderTargetProgram_);
    gl.enableVertexAttribArray(this.renderTargetAttribLocation_);
    gl.vertexAttribPointer(this.renderTargetAttribLocation_, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.renderTargetUniformLocation_, canvas.width, canvas.height);
    gl.uniform1i(this.renderTargetTextureLocation_, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * @return {HTMLCanvasElement} Canvas.
   */
  getCanvas() {
    return this.canvas_;
  }

  /**
   * Get the WebGL rendering context
   * @return {WebGLRenderingContext} The rendering context.
   * @api
   */
  getGL() {
    return this.gl_;
  }

  /**
   * Sets the matrices uniforms for a given frame state
   * @param {import("../PluggableMap.js").FrameState} frameState Frame state.
   */
  applyFrameState(frameState) {
    const size = frameState.size;
    const rotation = frameState.viewState.rotation;
    const resolution = frameState.viewState.resolution;
    const center = frameState.viewState.center;

    // set the "uniform" values (coordinates 0,0 are the center of the view)
    const projectionMatrix = resetTransform(this.projectionMatrix_);
    scaleTransform(projectionMatrix, 2 / (resolution * size[0]), 2 / (resolution * size[1]));
    rotateTransform(projectionMatrix, -rotation);
    translateTransform(projectionMatrix, -center[0], -center[1]);

    const offsetScaleMatrix = resetTransform(this.offsetScaleMatrix_);
    scaleTransform(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

    const offsetRotateMatrix = resetTransform(this.offsetRotateMatrix_);
    if (rotation !== 0) {
      rotateTransform(offsetRotateMatrix, -rotation);
    }

    this.setUniformMatrixValue(DefaultUniform.PROJECTION_MATRIX, fromTransform(this.tmpMat4_, projectionMatrix));
    this.setUniformMatrixValue(DefaultUniform.OFFSET_SCALE_MATRIX, fromTransform(this.tmpMat4_, offsetScaleMatrix));
    this.setUniformMatrixValue(DefaultUniform.OFFSET_ROTATION_MATRIX, fromTransform(this.tmpMat4_, offsetRotateMatrix));
  }

  /**
   * Get shader from the cache if it's in the cache. Otherwise, create
   * the WebGL shader, compile it, and add entry to cache.
   * @param {import("./Shader.js").default} shaderObject Shader object.
   * @return {WebGLShader} Shader.
   */
  getShader(shaderObject) {
    const shaderKey = getUid(shaderObject);
    if (shaderKey in this.shaderCache_) {
      return this.shaderCache_[shaderKey];
    } else {
      const gl = this.getGL();
      const shader = gl.createShader(shaderObject.getType());
      gl.shaderSource(shader, shaderObject.getSource());
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Shader compilation failed - log:\n${gl.getShaderInfoLog(shader)}`);
      }
      this.shaderCache_[shaderKey] = shader;
      return shader;
    }
  }

  /**
   * Use a program.  If the program is already in use, this will return `false`.
   * @param {WebGLProgram} program Program.
   * @return {boolean} Changed.
   * @api
   */
  useProgram(program) {
    if (program == this.currentProgram_) {
      return false;
    } else {
      const gl = this.getGL();
      gl.useProgram(program);
      this.currentProgram_ = program;
      this.uniformLocations_ = {};
      this.attribLocations_ = {};
      return true;
    }
  }

  /**
   * Get the program from the cache if it's in the cache. Otherwise create
   * the WebGL program, attach the shaders to it, and add an entry to the
   * cache.
   * @param {import("./Fragment.js").default} fragmentShaderObject Fragment shader.
   * @param {import("./Vertex.js").default} vertexShaderObject Vertex shader.
   * @return {WebGLProgram} Program.
   */
  getProgram(fragmentShaderObject, vertexShaderObject) {
    const programKey = getUid(fragmentShaderObject) + '/' + getUid(vertexShaderObject);
    if (programKey in this.programCache_) {
      return this.programCache_[programKey];
    } else {
      const gl = this.getGL();
      const program = gl.createProgram();
      gl.attachShader(program, this.getShader(fragmentShaderObject));
      gl.attachShader(program, this.getShader(vertexShaderObject));
      gl.linkProgram(program);
      this.programCache_[programKey] = program;
      return program;
    }
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Uniform name
   * @return {WebGLUniformLocation} uniformLocation
   */
  getUniformLocation(name) {
    if (!this.uniformLocations_[name]) {
      this.uniformLocations_[name] = this.getGL().getUniformLocation(this.currentProgram_, name);
    }
    return this.uniformLocations_[name];
  }

  /**
   * Will get the location from the shader or the cache
   * @param {string} name Attribute name
   * @return {number} attribLocation
   */
  getAttributeLocation(name) {
    if (!this.attribLocations_[name]) {
      this.attribLocations_[name] = this.getGL().getAttribLocation(this.currentProgram_, name);
    }
    return this.attribLocations_[name];
  }

  /**
   * Give a value for a standard float uniform
   * @param {string} uniform Uniform name
   * @param {number} value Value
   */
  setUniformFloatValue(uniform, value) {
    this.getGL().uniform1f(this.getUniformLocation(uniform), value);
  }

  /**
   * Give a value for a standard matrix4 uniform
   * @param {string} uniform Uniform name
   * @param {Array<number>} value Matrix value
   */
  setUniformMatrixValue(uniform, value) {
    this.getGL().uniformMatrix4fv(this.getUniformLocation(uniform), false, value);
  }

  /**
   * Will set the currently bound buffer to an attribute of the shader program
   * @param {string} attribName
   * @param {number} size Number of components per attributes
   * @param {number} type UNSIGNED_INT, UNSIGNED_BYTE, UNSIGNED_SHORT or FLOAT
   * @param {number} stride Stride in bytes (0 means attribs are packed)
   * @param {number} offset Offset in bytes
   */
  enableAttributeArray(attribName, size, type, stride, offset) {
    this.getGL().enableVertexAttribArray(this.getAttributeLocation(attribName));
    this.getGL().vertexAttribPointer(this.getAttributeLocation(attribName), size, type,
      false, stride, offset);
  }

  /**
   * FIXME empty description for jsdoc
   */
  handleWebGLContextLost() {
    clear(this.bufferCache_);
    clear(this.shaderCache_);
    clear(this.programCache_);
    this.currentProgram_ = null;
  }

  /**
   * FIXME empty description for jsdoc
   */
  handleWebGLContextRestored() {
  }

  // TODO: shutdown program

  /**
   * @param {number=} opt_wrapS wrapS.
   * @param {number=} opt_wrapT wrapT.
   * @return {WebGLTexture} The texture.
   */
  createTextureInternal(opt_wrapS, opt_wrapT) {
    const gl = this.getGL();
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    if (opt_wrapS !== undefined) {
      gl.texParameteri(
        TEXTURE_2D, TEXTURE_WRAP_S, opt_wrapS);
    }
    if (opt_wrapT !== undefined) {
      gl.texParameteri(
        TEXTURE_2D, TEXTURE_WRAP_T, opt_wrapT);
    }

    return texture;
  }

  /**
   * @param {number} width Width.
   * @param {number} height Height.
   * @param {number=} opt_wrapS wrapS.
   * @param {number=} opt_wrapT wrapT.
   * @return {WebGLTexture} The texture.
   */
  createEmptyTexture(width, height, opt_wrapS, opt_wrapT) {
    const gl = this.getGL();
    const texture = this.createTextureInternal( opt_wrapS, opt_wrapT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  }


  /**
   * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} image Image.
   * @param {number=} opt_wrapS wrapS.
   * @param {number=} opt_wrapT wrapT.
   * @return {WebGLTexture} The texture.
   */
  createTexture(image, opt_wrapS, opt_wrapT) {
    const gl = this.getGL();
    const texture = this.createTextureInternal(opt_wrapS, opt_wrapT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return texture;
  }
}

/**
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
export function createTextureInternal(gl, opt_wrapS, opt_wrapT) {
}

/**
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
export function createEmptyTexture(gl, width, height, opt_wrapS, opt_wrapT) {
}


/**
 * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} image Image.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
export function createTexture(gl, image, opt_wrapS, opt_wrapT) {
}

export default WebGLHelper;
