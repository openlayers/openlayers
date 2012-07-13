goog.provide('ol.webglrenderer.ArrayBuffer');

goog.require('goog.webgl');
goog.require('ol.webglrenderer.StaticGLObject');



/**
 * @constructor
 * @extends {ol.webglrenderer.StaticGLObject}
 * @param {WebGLRenderingContext} gl GL.
 * @param {ArrayBuffer|ArrayBufferView|null|number} data Data.
 * @param {number} usage Usage.
 */
ol.webglrenderer.ArrayBuffer = function(gl, data, usage) {

  goog.base(this, gl);

  /**
   * @private
   * @type {WebGLBuffer}
   */
  this.buffer_ = gl.createBuffer();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.buffer_);
  gl.bufferData(goog.webgl.ARRAY_BUFFER, data, usage);

};
goog.inherits(ol.webglrenderer.ArrayBuffer, ol.webglrenderer.StaticGLObject);


/**
 */
ol.webglrenderer.ArrayBuffer.prototype.bind = function() {
  var gl = this.getGL();
  gl.bindBuffer(goog.webgl.ARRAY_BUFFER, this.buffer_);
};


/**
 * @inheritDoc
 */
ol.webglrenderer.ArrayBuffer.prototype.disposeInternal = function() {
  var gl = this.getGL();
  gl.deleteBuffer(this.buffer_);
  this.buffer_ = null;
  goog.base(this, 'disposeInternal');
};
