goog.provide('ol.style.Fill');

goog.require('ol.color');


/**
 * @classdesc
 * Set fill style for vector features.
 *
 * @constructor
 * @param {olx.style.FillOptions=} opt_options Options.
 * @api
 */
ol.style.Fill = function(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {ol.Color|string}
   */
  this.color_ = options.color !== undefined ? options.color : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.checksum_ = undefined;
};


/**
 * Get the fill color.
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
  this.checksum_ = undefined;
};


/**
 * @return {string} The checksum.
 */
ol.style.Fill.prototype.getChecksum = function() {
  if (this.checksum_ === undefined) {
    this.checksum_ = 'f' + (this.color_ ?
        ol.color.asString(this.color_) : '-');
  }

  return this.checksum_;
};
