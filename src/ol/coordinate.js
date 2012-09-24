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
 * @const
 * @type {ol.Coordinate}
 */
ol.Coordinate.ZERO = new ol.Coordinate(0, 0);
