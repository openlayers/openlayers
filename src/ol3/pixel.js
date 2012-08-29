goog.provide('ol3.Pixel');

goog.require('goog.math.Coordinate');



/**
 * @constructor
 * @extends {goog.math.Coordinate}
 * @param {number} x X.
 * @param {number} y Y.
 */
ol3.Pixel = function(x, y) {
  goog.base(this, x, y);
};
goog.inherits(ol3.Pixel, goog.math.Coordinate);


/**
 * @return {ol3.Pixel} Clone.
 */
ol3.Pixel.prototype.clone = function() {
  return new ol3.Pixel(this.x, this.y);
};
