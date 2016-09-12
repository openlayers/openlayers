goog.provide('ol.style.Fill');

goog.require('ol');
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
   * @type {ol.Color|ol.ColorLike}
   */
  this.color_ = options.color !== undefined ? options.color : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.checksum_ = undefined;
};


/**
 * Clones the style. The color is not cloned if it is an {@link ol.ColorLike}.
 * @return {ol.style.Fill} The cloned style.
 * @api
 */
ol.style.Fill.prototype.clone = function() {
  var color = this.getColor();
  return new ol.style.Fill({
    color: (color && color.slice) ? color.slice() : color || undefined
  });
};


/**
 * Get the fill color.
 * @return {ol.Color|ol.ColorLike} Color.
 * @api
 */
ol.style.Fill.prototype.getColor = function() {
  return this.color_;
};


/**
 * Set the color.
 *
 * @param {ol.Color|ol.ColorLike} color Color.
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
    if (
        this.color_ instanceof CanvasPattern ||
        this.color_ instanceof CanvasGradient
    ) {
      this.checksum_ = ol.getUid(this.color_).toString();
    } else {
      this.checksum_ = 'f' + (this.color_ ?
          ol.color.asString(this.color_) : '-');
    }
  }

  return this.checksum_;
};
