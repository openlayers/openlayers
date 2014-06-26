goog.provide('ol.View');
goog.provide('ol.ViewHint');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.Object');


/**
 * @enum {number}
 */
ol.ViewHint = {
  ANIMATING: 0,
  INTERACTING: 1
};



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Maps can be viewed from different perspectives: 2D or 3D, or at different
 * angles. To enable this, properties determining projection, position, angle or
 * rotation cannot be part of the map itself, but of the particular view of that
 * map. This is similar to the concept of Camera in Google Earth or KML.
 *
 * Only {@link ol.View2D} is currently implemented.
 *
 * @constructor
 * @extends {ol.Object}
 */
ol.View = function() {

  goog.base(this);

  /**
   * @private
   * @type {Array.<number>}
   */
  this.hints_ = [0, 0];

};
goog.inherits(ol.View, ol.Object);


/**
 * @return {Array.<number>} Hint.
 */
ol.View.prototype.getHints = function() {
  return goog.array.clone(this.hints_);
};


/**
 * @return {ol.View2D} View2D.
 */
ol.View.prototype.getView2D = function() {
  // FIXME for some reason, we can't use goog.abstractMethod here
  goog.asserts.fail();
  return null;
};


/**
 * @return {boolean} Is defined.
 */
ol.View.prototype.isDef = function() {
  // FIXME for some reason, we can't use goog.abstractMethod here
  goog.asserts.fail();
  return false;
};


/**
 * @param {ol.ViewHint} hint Hint.
 * @param {number} delta Delta.
 * @return {number} New value.
 */
ol.View.prototype.setHint = function(hint, delta) {
  goog.asserts.assert(0 <= hint && hint < this.hints_.length);
  this.hints_[hint] += delta;
  goog.asserts.assert(this.hints_[hint] >= 0);
  return this.hints_[hint];
};
