goog.provide('ol.webglrenderer.StaticGLObject');

goog.require('goog.Disposable');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webglrenderer.StaticGLObject = function(gl) {

  goog.asserts.assert(!goog.isNull(gl));

  /**
   * @protected
   * @type {WebGLRenderingContext}
   */
  this.gl = gl;

};
goog.inherits(ol.webglrenderer.StaticGLObject, goog.Disposable);


/**
 * @inheritDoc
 */
ol.webglrenderer.StaticGLObject.prototype.disposeInternal = function() {
  this.gl = null;
  goog.base(this, 'disposeInternal');
};


/**
 * @return {!WebGLRenderingContext} GL.
 */
ol.webglrenderer.StaticGLObject.prototype.getGL = function() {
  goog.asserts.assert(!goog.isNull(this.gl));
  return this.gl;
};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webglrenderer.StaticGLObject.prototype.unsafeGetGL = function() {
  return this.gl;
};
