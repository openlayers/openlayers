goog.provide('ol.Coordinate');

goog.require('goog.math.Coordinate');



/**
 * @constructor
 * @extends {goog.math.Coordinate}
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.Coordinate = function(x, y) {
  goog.base(this, x, y);
};
goog.inherits(ol.Coordinate, goog.math.Coordinate);


/**
 * @return {ol.Coordinate} Clone.
 */
ol.Coordinate.prototype.clone = function() {
  return new ol.Coordinate(this.x, this.y);
};
