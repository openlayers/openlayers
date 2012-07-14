goog.provide('ol.webgl.StaticGLObject');

goog.require('goog.Disposable');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webgl.StaticGLObject = function(gl) {

  goog.asserts.assert(!goog.isNull(gl));

  /**
   * @protected
   * @type {WebGLRenderingContext}
   */
  this.gl = gl;

};
goog.inherits(ol.webgl.StaticGLObject, goog.Disposable);


/**
 * @inheritDoc
 */
ol.webgl.StaticGLObject.prototype.disposeInternal = function() {
  this.gl = null;
  goog.base(this, 'disposeInternal');
};


/**
 * @return {!WebGLRenderingContext} GL.
 */
ol.webgl.StaticGLObject.prototype.getGL = function() {
  goog.asserts.assert(!goog.isNull(this.gl));
  return this.gl;
};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webgl.StaticGLObject.prototype.unsafeGetGL = function() {
  return this.gl;
};
