import _ol_ from '../index';
import _ol_Disposable_ from '../disposable';
import _ol_array_ from '../array';
import _ol_events_ from '../events';
import _ol_obj_ from '../obj';
import _ol_webgl_ from '../webgl';
import _ol_webgl_ContextEventType_ from '../webgl/contexteventtype';

/**
 * @classdesc
 * A WebGL context for accessing low-level WebGL capabilities.
 *
 * @constructor
 * @extends {ol.Disposable}
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {WebGLRenderingContext} gl GL.
 */
var _ol_webgl_Context_ = function(canvas, gl) {

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
   * @type {Object.<string, ol.WebglBufferCacheEntry>}
   */
  this.bufferCache_ = {};

  /**
   * @private
   * @type {Object.<string, WebGLShader>}
   */
  this.shaderCache_ = {};

  /**
   * @private
   * @type {Object.<string, WebGLProgram>}
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
  this.hasOESElementIndexUint = _ol_array_.includes(
      _ol_.WEBGL_EXTENSIONS, 'OES_element_index_uint');

  // use the OES_element_index_uint extension if available
  if (this.hasOESElementIndexUint) {
    gl.getExtension('OES_element_index_uint');
  }

  _ol_events_.listen(this.canvas_, _ol_webgl_ContextEventType_.LOST,
      this.handleWebGLContextLost, this);
  _ol_events_.listen(this.canvas_, _ol_webgl_ContextEventType_.RESTORED,
      this.handleWebGLContextRestored, this);

};

_ol_.inherits(_ol_webgl_Context_, _ol_Disposable_);


/**
 * Just bind the buffer if it's in the cache. Otherwise create
 * the WebGL buffer, bind it, populate it, and add an entry to
 * the cache.
 * @param {number} target Target.
 * @param {ol.webgl.Buffer} buf Buffer.
 */
_ol_webgl_Context_.prototype.bindBuffer = function(target, buf) {
  var gl = this.getGL();
  var arr = buf.getArray();
  var bufferKey = String(_ol_.getUid(buf));
  if (bufferKey in this.bufferCache_) {
    var bufferCacheEntry = this.bufferCache_[bufferKey];
    gl.bindBuffer(target, bufferCacheEntry.buffer);
  } else {
    var buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    var /** @type {ArrayBufferView} */ arrayBuffer;
    if (target == _ol_webgl_.ARRAY_BUFFER) {
      arrayBuffer = new Float32Array(arr);
    } else if (target == _ol_webgl_.ELEMENT_ARRAY_BUFFER) {
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
 * @param {ol.webgl.Buffer} buf Buffer.
 */
_ol_webgl_Context_.prototype.deleteBuffer = function(buf) {
  var gl = this.getGL();
  var bufferKey = String(_ol_.getUid(buf));
  var bufferCacheEntry = this.bufferCache_[bufferKey];
  if (!gl.isContextLost()) {
    gl.deleteBuffer(bufferCacheEntry.buffer);
  }
  delete this.bufferCache_[bufferKey];
};


/**
 * @inheritDoc
 */
_ol_webgl_Context_.prototype.disposeInternal = function() {
  _ol_events_.unlistenAll(this.canvas_);
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    var key;
    for (key in this.bufferCache_) {
      gl.deleteBuffer(this.bufferCache_[key].buffer);
    }
    for (key in this.programCache_) {
      gl.deleteProgram(this.programCache_[key]);
    }
    for (key in this.shaderCache_) {
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
_ol_webgl_Context_.prototype.getCanvas = function() {
  return this.canvas_;
};


/**
 * Get the WebGL rendering context
 * @return {WebGLRenderingContext} The rendering context.
 * @api
 */
_ol_webgl_Context_.prototype.getGL = function() {
  return this.gl_;
};


/**
 * Get the frame buffer for hit detection.
 * @return {WebGLFramebuffer} The hit detection frame buffer.
 */
_ol_webgl_Context_.prototype.getHitDetectionFramebuffer = function() {
  if (!this.hitDetectionFramebuffer_) {
    this.initHitDetectionFramebuffer_();
  }
  return this.hitDetectionFramebuffer_;
};


/**
 * Get shader from the cache if it's in the cache. Otherwise, create
 * the WebGL shader, compile it, and add entry to cache.
 * @param {ol.webgl.Shader} shaderObject Shader object.
 * @return {WebGLShader} Shader.
 */
_ol_webgl_Context_.prototype.getShader = function(shaderObject) {
  var shaderKey = String(_ol_.getUid(shaderObject));
  if (shaderKey in this.shaderCache_) {
    return this.shaderCache_[shaderKey];
  } else {
    var gl = this.getGL();
    var shader = gl.createShader(shaderObject.getType());
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
 * @param {ol.webgl.Fragment} fragmentShaderObject Fragment shader.
 * @param {ol.webgl.Vertex} vertexShaderObject Vertex shader.
 * @return {WebGLProgram} Program.
 */
_ol_webgl_Context_.prototype.getProgram = function(
    fragmentShaderObject, vertexShaderObject) {
  var programKey =
      _ol_.getUid(fragmentShaderObject) + '/' + _ol_.getUid(vertexShaderObject);
  if (programKey in this.programCache_) {
    return this.programCache_[programKey];
  } else {
    var gl = this.getGL();
    var program = gl.createProgram();
    gl.attachShader(program, this.getShader(fragmentShaderObject));
    gl.attachShader(program, this.getShader(vertexShaderObject));
    gl.linkProgram(program);
    this.programCache_[programKey] = program;
    return program;
  }
};


/**
 * FIXME empy description for jsdoc
 */
_ol_webgl_Context_.prototype.handleWebGLContextLost = function() {
  _ol_obj_.clear(this.bufferCache_);
  _ol_obj_.clear(this.shaderCache_);
  _ol_obj_.clear(this.programCache_);
  this.currentProgram_ = null;
  this.hitDetectionFramebuffer_ = null;
  this.hitDetectionTexture_ = null;
  this.hitDetectionRenderbuffer_ = null;
};


/**
 * FIXME empy description for jsdoc
 */
_ol_webgl_Context_.prototype.handleWebGLContextRestored = function() {
};


/**
 * Creates a 1x1 pixel framebuffer for the hit-detection.
 * @private
 */
_ol_webgl_Context_.prototype.initHitDetectionFramebuffer_ = function() {
  var gl = this.gl_;
  var framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  var texture = _ol_webgl_Context_.createEmptyTexture(gl, 1, 1);
  var renderbuffer = gl.createRenderbuffer();
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
_ol_webgl_Context_.prototype.useProgram = function(program) {
  if (program == this.currentProgram_) {
    return false;
  } else {
    var gl = this.getGL();
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
 * @private
 */
_ol_webgl_Context_.createTexture_ = function(gl, opt_wrapS, opt_wrapT) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  if (opt_wrapS !== undefined) {
    gl.texParameteri(
        _ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_WRAP_S, opt_wrapS);
  }
  if (opt_wrapT !== undefined) {
    gl.texParameteri(
        _ol_webgl_.TEXTURE_2D, _ol_webgl_.TEXTURE_WRAP_T, opt_wrapT);
  }

  return texture;
};


/**
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
_ol_webgl_Context_.createEmptyTexture = function(
    gl, width, height, opt_wrapS, opt_wrapT) {
  var texture = _ol_webgl_Context_.createTexture_(gl, opt_wrapS, opt_wrapT);
  gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      null);

  return texture;
};


/**
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} image Image.
 * @param {number=} opt_wrapS wrapS.
 * @param {number=} opt_wrapT wrapT.
 * @return {WebGLTexture} The texture.
 */
_ol_webgl_Context_.createTexture = function(gl, image, opt_wrapS, opt_wrapT) {
  var texture = _ol_webgl_Context_.createTexture_(gl, opt_wrapS, opt_wrapT);
  gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return texture;
};
export default _ol_webgl_Context_;
