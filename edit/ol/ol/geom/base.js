goog.provide('ol.geom');

goog.require('ol.coordinate');


/**
 * Calculate the squared distance from a point to a line segment.
 *
 * @param {ol.Coordinate} coordinate Coordinate of the point.
 * @param {Array.<ol.Coordinate>} segment Line segment (2 coordinates).
 * @return {number} Squared distance from the point to the line segment.
 */
ol.geom.squaredDistanceToSegment = function(coordinate, segment) {
  return ol.coordinate.closestOnSegment(coordinate, segment)[2];
};
