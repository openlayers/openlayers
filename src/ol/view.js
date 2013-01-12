goog.provide('ol.View');
goog.provide('ol.ViewHint');

goog.require('ol.IView');
goog.require('ol.IView2D');
goog.require('ol.IView3D');


/**
 * @enum {number}
 */
ol.ViewHint = {
  PANNING: 0
};



/**
 * @constructor
 * @implements {ol.IView}
 * @extends {ol.Object}
 */
ol.View = function() {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.hints_ = [0];

};
goog.inherits(ol.View, ol.Object);


/**
 * @return {Array.<number>} Hint.
 */
ol.View.prototype.getHints = function() {
  return this.hints_;
};


/**
 * @inheritDoc
 */
ol.View.prototype.getView2D = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.View.prototype.getView3D = goog.abstractMethod;


/**
 * @param {ol.ViewHint} hint Hint.
 * @param {number} delta Delta.
 */
ol.View.prototype.setHint = function(hint, delta) {
  goog.asserts.assert(0 <= hint && hint < this.hints_.length);
  this.hints_[hint] += delta;
  goog.asserts.assert(this.hints_[hint] >= 0);
};
