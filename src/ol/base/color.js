goog.provide('ol.Color');

goog.require('goog.color');



/**
 * @constructor
 * @param {number} r Red.
 * @param {number} g Green.
 * @param {number} b Blue.
 * @param {number} a Alpha.
 */
ol.Color = function(r, g, b, a) {

  /**
   * @type {number}
   */
  this.r = r;

  /**
   * @type {number}
   */
  this.g = g;

  /**
   * @type {number}
   */
  this.b = b;

  /**
   * @type {number}
   */
  this.a = a;

};


/**
 * @param {string} str String.
 * @param {number=} opt_a Alpha.
 * @return {ol.Color} Color.
 */
ol.Color.createFromString = function(str, opt_a) {
  var rgb = goog.color.hexToRgb(goog.color.parse(str).hex);
  var a = goog.isDef(opt_a) ? opt_a : 255;
  return new ol.Color(rgb[0], rgb[1], rgb[2], a);
};


/**
 * @return {ol.Color} Clone.
 */
ol.Color.prototype.clone = function() {
  return new ol.Color(this.r, this.g, this.b, this.a);
};
