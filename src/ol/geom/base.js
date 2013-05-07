goog.provide('ol.geom.Vertex');
goog.provide('ol.geom.VertexArray');

goog.require('ol.coordinate');


/**
 * @typedef {Array.<number>}
 */
ol.geom.Vertex;


/**
 * @typedef {Array.<ol.geom.Vertex>}
 */
ol.geom.VertexArray;


/**
 * Calculate the squared distance from a point to a line segment.
 *
 * @param {ol.Coordinate} coordinate Coordinate of the point.
 * @param {Array.<ol.Coordinate>} segment Line segment (2 coordinates).
 * @return {number} Squared distance from the point to the line segment.
 */
ol.geom.squaredDistanceToSegment = function(coordinate, segment) {
  // http://de.softuses.com/103478, Kommentar #1
  var v = segment[0];
  var w = segment[1];
  var l2 = ol.coordinate.squaredDistance(v, w);
  if (l2 == 0) {
    return ol.coordinate.squaredDistance(coordinate, v);
  }
  var t = ((coordinate[0] - v[0]) * (w[0] - v[0]) +
      (coordinate[1] - v[1]) * (w[1] - v[1])) / l2;
  if (t < 0) {
    return ol.coordinate.squaredDistance(coordinate, v);
  }
  if (t > 1) {
    return ol.coordinate.squaredDistance(coordinate, w);
  }
  return ol.coordinate.squaredDistance(coordinate,
      [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]);
};
