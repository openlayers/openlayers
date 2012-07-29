goog.provide('ol.Coordinate');

goog.require('goog.math.Vec2');



/**
 * @constructor
 * @extends {goog.math.Vec2}
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.Coordinate = function(x, y) {
  goog.base(this, x, y);
};
goog.inherits(ol.Coordinate, goog.math.Vec2);


/**
 * @return {ol.Coordinate} Clone.
 */
ol.Coordinate.prototype.clone = function() {
  return new ol.Coordinate(this.x, this.y);
};
