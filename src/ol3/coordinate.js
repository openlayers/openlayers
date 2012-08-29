goog.provide('ol3.Coordinate');

goog.require('goog.math.Vec2');



/**
 * @constructor
 * @extends {goog.math.Vec2}
 * @param {number} x X.
 * @param {number} y Y.
 */
ol3.Coordinate = function(x, y) {
  goog.base(this, x, y);
};
goog.inherits(ol3.Coordinate, goog.math.Vec2);


/**
 * @const
 * @type {ol3.Coordinate}
 */
ol3.Coordinate.ZERO = new ol3.Coordinate(0, 0);


/**
 * @return {ol3.Coordinate} Clone.
 */
ol3.Coordinate.prototype.clone = function() {
  return new ol3.Coordinate(this.x, this.y);
};
