goog.provide('ol.style.Fill');

goog.require('goog.asserts');



/**
 * @classdesc
 * Set fill style for vector features.
 *
 * @constructor
 * @param {olx.style.FillOptions=} opt_options Options.
 * @api
 */
ol.style.Fill = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.color_ = goog.isDef(options.color) ? options.color : null;

  /**
   * @private
   * @type {boolean}
   */
  this.mutable_ = true;

};


/**
 * @return {ol.Color|string} Color.
 * @api
 */
ol.style.Fill.prototype.getColor = function() {
  return this.color_;
};


/**
 * @param {ol.Color|string} color Color.
 * @api
 */
ol.style.Fill.prototype.setColor = function(color) {
  goog.asserts.assert(this.mutable_);
  this.color_ = color;
};


/**
 * @param {boolean} mutable Mutable.
 */
ol.style.Fill.prototype.setMutable = function(mutable) {
  this.mutable_ = mutable;
};
