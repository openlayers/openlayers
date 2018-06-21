/**
 * @module ol/webgl/Context
 */
import {getUid, inherits} from '../util.js';
import {EXTENSIONS as WEBGL_EXTENSIONS} from '../webgl.js';
import Disposable from '../Disposable.js';
import {includes} from '../array.js';
import {listen, unlistenAll} from '../events.js';
import {clear} from '../obj.js';
import {ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, TEXTURE_2D, TEXTURE_WRAP_S, TEXTURE_WRAP_T} from '../webgl.js';
import ContextEventType from '../webgl/ContextEventType.js';


/**
 * @typedef {Object} BufferCacheEntry
 * @property {module:ol/webgl/Buffer} buf
 * @property {WebGLBuffer} buffer
 */


/**
 * @classdesc
 * A WebGL context for accessing low-level WebGL capabilities.
 *
 * @constructor
 * @extends {module:ol/Disposable}
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {WebGLRenderingContext} gl GL.
 */
const WebGLContext = function(canvas, gl) {

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = canvas;

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = gl;

  /**
   * @private
   * @type {!Object.<string, module:ol/webgl/Context~BufferCacheEntry>}
   */
  this.bufferCache_ = {};

  /**
   * @private
   * @type {!Object.<string, WebGLShader>}
   */
  this.shaderCache_ = {};

  /**
   * @private
   * @type {!Object.<string, WebGLProgram>}
   */
  this.programCache_ = {};

  /**
   * @private
   * @type {WebGLProgram}
   */
  this.currentProgram_ = null;

  /**
   * @private
   * @type {WebGLFramebuffer}
   */
  this.hitDetectionFramebuffer_ = null;

  /**
   * @private
   * @type {WebGLTexture}
   */
  this.hitDetectionTexture_ = null;

  /**
   * @private
   * @type {WebGLRenderbuffer}
   */
  this.hitDetectionRenderbuffer_ = null;

  /**
   * @type {boolean}
   */
  this.hasOESElementIndexUint = includes(WEBGL_EXTENSIONS, 'OES_element_index_uint');

  // use the OES_element_index_uint extension if available
  if (this.hasOESElementIndexUint) {
    gl.getExtension('OES_element_index_uint');
  }

  listen(this.canvas_, ContextEventType.LOST,
    this.handleWebGLContextLost, this);
  listen(this.canvas_, ContextEventType.RESTORED,
    this.handleWebGLContextRestored, this);

};

inherits(WebGLContext, Disposable);


/**
 * Just bind the buffer if it's in the cache. Otherwise create
 * the WebGL buffer, bind it, populate it, and add an entry to
 * the cache.
 * @param {number} target Target.
 * @param {module:ol/webgl/Buffer} buf Buffer.
 */
WebGLContext.prototype.bindBuffer = function(target, buf) {
  const gl = this.getGL();
  const arr = buf.getArray();
  const bufferKey = String(getUid(buf));
  if (bufferKey in this.bufferCache_) {
    const bufferCacheEntry = this.bufferCache_[bufferKey];
    gl.bindBuffer(target, bufferCacheEntry.buffer);
  } else {
    const buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    let /** @type {ArrayBufferView} */ arrayBuffer;
    if (target == ARRAY_BUFFER) {
      arrayBuffer = new Float32Array(arr);
    } else if (target == ELEMENT_ARRAY_BUFFER) {
      arrayBuffer = this.hasOESElementIndexUint ?
        new Uint32Array(arr) : new Uint16Array(arr);
    }
    gl.bufferData(target, arrayBuffer, buf.getUsage());
    this.bufferCache_[bufferKey] = {
      buf: buf,
      buffer: buffer
    };
  }
};


/**
 * @param {module:ol/webgl/Buffer} buf Buffer.
 */
WebGLContext.prototype.deleteBuffer = function(buf) {
  const gl = this.getGL();
  const bufferKey = String(getUid(buf));
  const bufferCacheEntry = this.bufferCache_[bufferKey];
  if (!gl.isContextLost()) {
    gl.deleteBuffer(bufferCacheEntry.buffer);
  }
  delete this.bufferCache_[bufferKey];
};


/**
 * @inheritDoc
 */
WebGLContext.prototype.disposeInternal = function() {
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
    // delete objects for hit-detection
    gl.deleteFramebuffer(this.hitDetectionFramebuffer_);
    gl.deleteRenderbuffer(this.hitDetectionRenderbuffer_);
    gl.deleteTexture(this.hitDetectionTexture_);
  }
};


/**
 * @return {HTMLCanvasElement} Canvas.
 */
WebGLContext.prototype.getCanvas = function() {
  return this.canvas_;
};


/**
 * Get the WebGL rendering context
 * @return {WebGLRenderingContext} The rendering context.
 * @api
 */
WebGLContext.prototype.getGL = function() {
  return this.gl_;
};


/**
 * Get the frame buffer for hit detection.
 * @return {WebGLFramebuffer} The hit detection frame buffer.
 */
WebGLContext.prototype.getHitDetectionFramebuffer = function() {
  if (!this.hitDetectionFramebuffer_) {
    this.initHitDetectionFramebuffer_();
  }
  return this.hitDetectionFramebuffer_;
};


/**
 * Get shader from the cache if it's in the cache. Otherwise, create
 * the WebGL shader, compile it, and add entry to cache.
 * @param {module:ol/webgl/Shader} shaderObject Shader object.
 * @return {WebGLShader} Shader.
 */
WebGLContext.prototype.getShader = function(shaderObject) {
  const shaderKey = String(getUid(shaderObject));
  if (shaderKey in this.shaderCache_) {
    return this.shaderCache_[shaderKey];
  } else {
    const gl = this.getGL();
    const shader = gl.createShader(shaderObject.getType());
    gl.shaderSource(shader, shaderObject.getSource());
    gl.compileShader(shader);
    this.shaderCache_[shaderKey] = shader;
    return shader;
  }
};


/**
 * Get the program from the cache if it's in the cache. Otherwise create
 * the WebGL program, attach the shaders to it, and add an entry to the
 * cache.
 * @param {module:ol/webgl/Fragment} fragmentShaderObject Fragment shader.
 * @param {module:ol/webgl/Vertex} vertexShaderObject Vertex shader.
 * @return {WebGLProgram} Program.
 */
WebGLContext.prototype.getProgram = function(fragmentShaderObject, vertexShaderObject) {
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
};


/**
 * FIXME empty description for jsdoc
 */
WebGLContext.prototype.handleWebGLContextLost = function() {
  clear(this.bufferCache_);
  clear(this.shaderCache_);
  clear(this.programCache_);
  this.currentProgram_ = null;
  this.hitDetectionFramebuffer_ = null;
  this.hitDetectionTexture_ = null;
  this.hitDetectionRenderbuffer_ = null;
};


/**
 * FIXME empty description for jsdoc
 */
WebGLContext.prototype.handleWebGLContextRestored = function() {
};


/**
 * Creates a 1x1 pixel framebuffer for the hit-detection.
 * @private
 */
WebGLContext.prototype.initHitDetectionFramebuffer_ = function() {
  const gl = this.gl_;
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  const texture = createEmptyTexture(gl, 1, 1);
  const renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1, 1);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER, renderbuffer);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  this.hitDetectionFramebuffer_ = framebuffer;
  this.hitDetectionTexture_ = texture;
  this.hitDetectionRenderbuffer_ = renderbuffer;
};


/**
 * Use a program.  If the program is already in use, this will return `false`.
 * @param {WebGLProgram} program Program.
 * @return {boolean} Changed.
 * @api
 */
WebGLContext.prototype.useProgram = function(program) {
  if (program == this.currentProgram_) {
    return false;
  } else {
    const gl = this.getGL();
    gl.useProgram(program);
    this.currentProgram_ = program;
    return true;
  }
};


/**
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
function createTextureInternal(gl, opt_wrapS, opt_wrapT) {
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
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
export function createEmptyTexture(gl, width, height, opt_wrapS, opt_wrapT) {
  const texture = createTextureInternal(gl, opt_wrapS, opt_wrapT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return texture;
}


/**
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} image Image.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
export function createTexture(gl, image, opt_wrapS, opt_wrapT) {
  const texture = createTextureInternal(gl, opt_wrapS, opt_wrapT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return texture;
}

export default WebGLContext;
