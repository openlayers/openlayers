goog.provide('ol3.Color');

goog.require('goog.color');



/**
 * @constructor
 * @param {number} r Red.
 * @param {number} g Green.
 * @param {number} b Blue.
 * @param {number} a Alpha.
 */
ol3.Color = function(r, g, b, a) {

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
 * @return {ol3.Color} Color.
 */
ol3.Color.createFromString = function(str, opt_a) {
  var rgb = goog.color.hexToRgb(goog.color.parse(str).hex);
  var a = opt_a || 255;
  return new ol3.Color(rgb[0], rgb[1], rgb[2], a);
};


/**
 * @return {ol3.Color} Clone.
 */
ol3.Color.prototype.clone = function() {
  return new ol3.Color(this.r, this.g, this.b, this.a);
};
