goog.provide('ol.webglrenderer.GLObject');

goog.require('goog.Disposable');
goog.require('ol.webglrenderer.IGLObject');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @implements {ol.webglrenderer.IGLObject}
 */
ol.webglrenderer.GLObject = function() {

  goog.base(this);

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = null;

};
goog.inherits(ol.webglrenderer.GLObject, goog.Disposable);


/**
 * @inheritDoc
 */
ol.webglrenderer.GLObject.prototype.disposeInternal = function() {
  this.setGL(null);
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.webglrenderer.GLObject.prototype.getGL = function() {
  goog.asserts.assert(!goog.isNull(this.gl_));
  return this.gl_;
};


/**
 * @inheritDoc
 */
ol.webglrenderer.GLObject.prototype.setGL = function(gl) {
  this.gl_ = gl;
};
