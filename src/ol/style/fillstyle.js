goog.provide('ol.style.Fill');

goog.require('goog.string');
goog.require('ol.color');
goog.require('ol.structs.IHashable');



/**
 * @classdesc
 * Set fill style for vector features.
 *
 * @constructor
 * @param {olx.style.FillOptions=} opt_options Options.
 * @implements {ol.structs.IHashable}
 * @api
 */
ol.style.Fill = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.color_ = goog.isDef(options.color) ? options.color : null;
};


/**
 * @return {ol.Color|string} Color.
 * @api
 */
ol.style.Fill.prototype.getColor = function() {
  return this.color_;
};


/**
 * Set the color.
 *
 * @param {ol.Color|string} color Color.
 * @api
 */
ol.style.Fill.prototype.setColor = function(color) {
  this.color_ = color;
};


/**
 * @inheritDoc
 */
ol.style.Fill.prototype.hashCode = function() {
  var hash = 17;

  hash = hash * 23 + (!goog.isNull(this.color_) ?
      goog.string.hashCode(ol.color.asString(this.color_)) : 0);

  return hash;
};
