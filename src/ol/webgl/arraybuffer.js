goog.provide('ol.webgl.ArrayBuffer');

goog.require('goog.webgl');
goog.require('ol.webgl.StaticGLObject');



/**
 * @constructor
 * @extends {ol.webgl.StaticGLObject}
 * @param {WebGLRenderingContext} gl GL.
 * @param {ArrayBuffer|ArrayBufferView|null|number} data Data.
 * @param {number} usage Usage.
 */
ol.webgl.ArrayBuffer = function(gl, data, usage) {

  goog.base(this, gl);

  /**
   * @private
   * @type {WebGLBuffer}
   */
  this.buffer_ = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.buffer_);
  gl.bufferData(goog.webgl.ARRAY_BUFFER, data, usage);

};
goog.inherits(ol.webgl.ArrayBuffer, ol.webgl.StaticGLObject);


/**
 */
ol.webgl.ArrayBuffer.prototype.bind = function() {
  var gl = this.getGL();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.buffer_);
};


/**
 * @inheritDoc
 */
ol.webgl.ArrayBuffer.prototype.disposeInternal = function() {
  var gl = this.getGL();
  gl.deleteBuffer(this.buffer_);
  this.buffer_ = null;
  goog.base(this, 'disposeInternal');
};
