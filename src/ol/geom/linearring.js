goog.provide('ol.geom.LinearRing');

goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * @constructor
 * @extends {ol.geom.LineString}
 * @param {ol.geom.VertexArray} coordinates Vertex array (e.g.
 *    [[x0, y0], [x1, y1]]).
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.LinearRing = function(coordinates, opt_shared) {
  goog.base(this, coordinates, opt_shared);

  /**
   * We're intentionally not enforcing that rings be closed right now.  This
   * will allow proper rendering of data from tiled vector sources that leave
   * open rings.
   */

};
goog.inherits(ol.geom.LinearRing, ol.geom.LineString);


/**
 * Determine if a vertex array representing a linear ring is in clockwise
 * order.
 *
 * This method comes from Green's Theorem and was mentioned in an answer to a
 * a Stack Overflow question (http://tinyurl.com/clockwise-method).
 *
 * Note that calculating the cross product for each pair of edges could be
 * avoided by first finding the lowest, rightmost vertex.  See OGR's
 * implementation for an example of this.
 * https://github.com/OSGeo/gdal/blob/trunk/gdal/ogr/ogrlinearring.cpp
 *
 * @param {ol.geom.VertexArray} coordinates Linear ring coordinates.
 * @return {boolean} The coordinates are in clockwise order.
 */
ol.geom.LinearRing.isClockwise = function(coordinates) {
  var length = coordinates.length;
  var edge = 0;

  var last = coordinates[length - 1];
  var x1 = last[0];
  var y1 = last[1];

  var x2, y2, coord;
  for (var i = 0; i < length; ++i) {
    coord = coordinates[i];
    x2 = coord[0];
    y2 = coord[1];
    edge += (x2 - x1) * (y2 + y1);
    x1 = x2;
    y1 = y2;
  }
  return edge > 0;
};


/**
 * @inheritDoc
 */
ol.geom.LinearRing.prototype.getType = function() {
  return ol.geom.GeometryType.LINEARRING;
};


/**
 * Check whether a given coordinate is inside this ring. Note that this is a
 * fast and simple check - points on an edge or vertex of the ring are either
 * classified inside or outside.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Whether the coordinate is inside the ring.
 */
ol.geom.LinearRing.prototype.containsCoordinate = function(coordinate) {
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  var x = coordinate[0], y = coordinate[1];
  var vertices = this.getCoordinates();
  var inside = false;
  var xi, yi, xj, yj, intersect;
  var numVertices = vertices.length;
  for (var i = 0, j = numVertices - 1; i < numVertices; j = i++) {
    xi = vertices[i][0];
    yi = vertices[i][1];
    xj = vertices[j][0];
    yj = vertices[j][1];
    intersect = ((yi > y) != (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
};
