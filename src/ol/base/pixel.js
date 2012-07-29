goog.provide('ol.Pixel');

goog.require('goog.math.Coordinate');



/**
 * @constructor
 * @extends {goog.math.Coordinate}
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.Pixel = function(x, y) {
  goog.base(this, x, y);
};
goog.inherits(ol.Pixel, goog.math.Coordinate);


/**
 * @return {ol.Pixel} Clone.
 */
ol.Pixel.prototype.clone = function() {
  return new ol.Pixel(this.x, this.y);
};
