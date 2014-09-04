goog.provide('ol.style.Fill');



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
};


/**
 * @return {ol.Color|string} Color.
 * @api
 */
ol.style.Fill.prototype.getColor = function() {
  return this.color_;
};


/**
 * Set the color. Use `setStyle()` on the feature, layer or feature overlay
 * for changes to take effect.
 *
 * @param {ol.Color|string} color Color.
 * @api
 */
ol.style.Fill.prototype.setColor = function(color) {
  this.color_ = color;
};
