goog.provide('ol.webgl.GLObject');

goog.require('goog.Disposable');
goog.require('ol.webgl.IGLObject');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @implements {ol.webgl.IGLObject}
 */
ol.webgl.GLObject = function() {

  goog.base(this);

  /**
   * @private
   * @type {WebGLRenderingContext}
   */
  this.gl_ = null;

};
goog.inherits(ol.webgl.GLObject, goog.Disposable);


/**
 * @inheritDoc
 */
ol.webgl.GLObject.prototype.disposeInternal = function() {
  this.setGL(null);
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.webgl.GLObject.prototype.getGL = function() {
  goog.asserts.assert(!goog.isNull(this.gl_));
  return this.gl_;
};


/**
 * @inheritDoc
 */
ol.webgl.GLObject.prototype.setGL = function(gl) {
  this.gl_ = gl;
};
