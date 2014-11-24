goog.provide('ol.webgl.Context');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.log');
goog.require('goog.object');
goog.require('ol');
goog.require('ol.webgl.Buffer');
goog.require('ol.webgl.WebGLContextEventType');


/**
 * @typedef {{buf: ol.webgl.Buffer,
 *            buffer: WebGLBuffer}}
 */
ol.webgl.BufferCacheEntry;



/**
 * @classdesc
 * A WebGL context for accessing low-level WebGL capabilities.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {WebGLRenderingContext} gl GL.
 * @api
 */
ol.webgl.Context = function(canvas, gl) {

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
   * @type {Object.<number, ol.webgl.BufferCacheEntry>}
   */
  this.bufferCache_ = {};

  /**
   * @private
   * @type {Object.<number, WebGLShader>}
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
   * @type {boolean}
   */
  this.hasOESElementIndexUint = goog.array.contains(
      ol.WEBGL_EXTENSIONS, 'OES_element_index_uint');

  // use the OES_element_index_uint extension if available
  if (this.hasOESElementIndexUint) {
    var ext = gl.getExtension('OES_element_index_uint');
    goog.asserts.assert(!goog.isNull(ext));
  }

  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.LOST,
      this.handleWebGLContextLost, false, this);
  goog.events.listen(this.canvas_, ol.webgl.WebGLContextEventType.RESTORED,
      this.handleWebGLContextRestored, false, this);

};


/**
 * Just bind the buffer if it's in the cache. Otherwise create
 * the WebGL buffer, bind it, populate it, and add an entry to
 * the cache.
 * @param {number} target Target.
 * @param {ol.webgl.Buffer} buf Buffer.
 */
ol.webgl.Context.prototype.bindBuffer = function(target, buf) {
  var gl = this.getGL();
  var arr = buf.getArray();
  var bufferKey = goog.getUid(buf);
  if (bufferKey in this.bufferCache_) {
    var bufferCacheEntry = this.bufferCache_[bufferKey];
    gl.bindBuffer(target, bufferCacheEntry.buffer);
  } else {
    var buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    goog.asserts.assert(target == goog.webgl.ARRAY_BUFFER ||
        target == goog.webgl.ELEMENT_ARRAY_BUFFER);
    var /** @type {ArrayBufferView} */ arrayBuffer;
    if (target == goog.webgl.ARRAY_BUFFER) {
      arrayBuffer = new Float32Array(arr);
    } else if (target == goog.webgl.ELEMENT_ARRAY_BUFFER) {
      arrayBuffer = this.hasOESElementIndexUint ?
          new Uint32Array(arr) : new Uint16Array(arr);
    } else {
      goog.asserts.fail();
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
ol.webgl.Context.prototype.deleteBuffer = function(buf) {
  var gl = this.getGL();
  var bufferKey = goog.getUid(buf);
  goog.asserts.assert(bufferKey in this.bufferCache_);
  var bufferCacheEntry = this.bufferCache_[bufferKey];
  if (!gl.isContextLost()) {
    gl.deleteBuffer(bufferCacheEntry.buffer);
  }
  delete this.bufferCache_[bufferKey];
};


/**
 * @inheritDoc
 */
ol.webgl.Context.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    goog.object.forEach(this.bufferCache_, function(bufferCacheEntry) {
      gl.deleteBuffer(bufferCacheEntry.buffer);
    });
    goog.object.forEach(this.programCache_, function(program) {
      gl.deleteProgram(program);
    });
    goog.object.forEach(this.shaderCache_, function(shader) {
      gl.deleteShader(shader);
    });
  }
};


/**
 * @return {HTMLCanvasElement} Canvas.
 */
ol.webgl.Context.prototype.getCanvas = function() {
  return this.canvas_;
};


/**
 * @return {WebGLRenderingContext} GL.
 * @api
 */
ol.webgl.Context.prototype.getGL = function() {
  return this.gl_;
};


/**
 * Get shader from the cache if it's in the cache. Otherwise, create
 * the WebGL shader, compile it, and add entry to cache.
 * @param {ol.webgl.Shader} shaderObject Shader object.
 * @return {WebGLShader} Shader.
 */
ol.webgl.Context.prototype.getShader = function(shaderObject) {
  var shaderKey = goog.getUid(shaderObject);
  if (shaderKey in this.shaderCache_) {
    return this.shaderCache_[shaderKey];
  } else {
    var gl = this.getGL();
    var shader = gl.createShader(shaderObject.getType());
    gl.shaderSource(shader, shaderObject.getSource());
    gl.compileShader(shader);
    if (goog.DEBUG) {
      if (!gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS) &&
          !gl.isContextLost()) {
        goog.log.error(this.logger_, gl.getShaderInfoLog(shader));
      }
    }
    goog.asserts.assert(
        gl.getShaderParameter(shader, goog.webgl.COMPILE_STATUS) ||
        gl.isContextLost());
    this.shaderCache_[shaderKey] = shader;
    return shader;
  }
};


/**
 * Get the program from the cache if it's in the cache. Otherwise create
 * the WebGL program, attach the shaders to it, and add an entry to the
 * cache.
 * @param {ol.webgl.shader.Fragment} fragmentShaderObject Fragment shader.
 * @param {ol.webgl.shader.Vertex} vertexShaderObject Vertex shader.
 * @return {WebGLProgram} Program.
 */
ol.webgl.Context.prototype.getProgram = function(
    fragmentShaderObject, vertexShaderObject) {
  var programKey =
      goog.getUid(fragmentShaderObject) + '/' + goog.getUid(vertexShaderObject);
  if (programKey in this.programCache_) {
    return this.programCache_[programKey];
  } else {
    var gl = this.getGL();
    var program = gl.createProgram();
    gl.attachShader(program, this.getShader(fragmentShaderObject));
    gl.attachShader(program, this.getShader(vertexShaderObject));
    gl.linkProgram(program);
    if (goog.DEBUG) {
      if (!gl.getProgramParameter(program, goog.webgl.LINK_STATUS) &&
          !gl.isContextLost()) {
        goog.log.error(this.logger_, gl.getProgramInfoLog(program));
      }
    }
    goog.asserts.assert(
        gl.getProgramParameter(program, goog.webgl.LINK_STATUS) ||
        gl.isContextLost());
    this.programCache_[programKey] = program;
    return program;
  }
};


/**
 * FIXME empy description for jsdoc
 */
ol.webgl.Context.prototype.handleWebGLContextLost = function() {
  goog.object.clear(this.bufferCache_);
  goog.object.clear(this.shaderCache_);
  goog.object.clear(this.programCache_);
  this.currentProgram_ = null;
};


/**
 * FIXME empy description for jsdoc
 */
ol.webgl.Context.prototype.handleWebGLContextRestored = function() {
};


/**
 * Just return false if that program is used already. Other use
 * that program (call `gl.useProgram`) and make it the "current
 * program".
 * @param {WebGLProgram} program Program.
 * @return {boolean} Changed.
 * @api
 */
ol.webgl.Context.prototype.useProgram = function(program) {
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
 * @private
 * @type {goog.log.Logger}
 */
ol.webgl.Context.prototype.logger_ = goog.log.getLogger('ol.webgl.Context');
