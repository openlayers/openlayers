goog.provide('ol.geom.Polygon');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * Create a polygon from an array of vertex arrays.  Coordinates for the
 * exterior ring will be forced to clockwise order.  Coordinates for any
 * interior rings will be forced to counter-clockwise order.  In cases where
 * the opposite winding order occurs in the passed vertex arrays, they will
 * be modified in place.
 *
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.geom.VertexArray>} coordinates Array of rings.  First
 *    is outer, any remaining are inner.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.Polygon = function(coordinates, opt_shared) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0][0]));

  var vertices = opt_shared,
      dimension;

  if (!goog.isDef(vertices)) {
    // try to get dimension from first vertex in first ring
    dimension = coordinates[0][0].length;
    vertices = new ol.geom.SharedVertices({dimension: dimension});
  }

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.labelPoint_ = null;

  /**
   * @type {ol.geom.SharedVertices}
   */
  this.vertices = vertices;

  var numRings = coordinates.length;

  /**
   * @type {Array.<ol.geom.LinearRing>}
   */
  this.rings = new Array(numRings);
  var ringCoords;
  for (var i = 0; i < numRings; ++i) {
    ringCoords = coordinates[i];
    if (i === 0) {
      // force exterior ring to be clockwise
      if (!ol.geom.LinearRing.isClockwise(ringCoords)) {
        ringCoords.reverse();
      }
    } else {
      // force interior rings to be counter-clockwise
      if (ol.geom.LinearRing.isClockwise(ringCoords)) {
        ringCoords.reverse();
      }
    }
    this.rings[i] = new ol.geom.LinearRing(ringCoords, vertices);
  }

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();
  goog.asserts.assert(this.dimension >= 2);

};
goog.inherits(ol.geom.Polygon, ol.geom.Geometry);


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getBounds = function() {
  return this.rings[0].getBounds();
};


/**
 * @return {Array.<ol.geom.VertexArray>} Coordinates array.
 */
ol.geom.Polygon.prototype.getCoordinates = function() {
  var count = this.rings.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = this.rings[i].getCoordinates();
  }
  return coordinates;
};


/**
 * @inheritDoc
 */
ol.geom.Polygon.prototype.getType = function() {
  return ol.geom.GeometryType.POLYGON;
};


/**
 * Check whether a given coordinate is inside this polygon. Note that this is a
 * fast and simple check - points on an edge or vertex of the polygon or one of
 * its inner rings are either classified inside or outside.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Whether the coordinate is inside the polygon.
 */
ol.geom.Polygon.prototype.containsCoordinate = function(coordinate) {
  var rings = this.rings;
  /** @type {boolean} */
  var containsCoordinate;
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    containsCoordinate = rings[i].containsCoordinate(coordinate);
    // if inner ring (i > 0) contains coordinate, polygon does not contain it
    if (i > 0) {
      containsCoordinate = !containsCoordinate;
    }
    if (!containsCoordinate) {
      break;
    }
  }
  return containsCoordinate;
};


/**
 * Calculates a point that is guaranteed to lie in the interior of the polygon.
 * Inspired by JTS's com.vividsolutions.jts.geom.Geometry#getInteriorPoint.
 * @return {ol.Coordinate} A point which is in the interior of the polygon.
 */
ol.geom.Polygon.prototype.getInteriorPoint = function() {
  if (goog.isNull(this.labelPoint_)) {
    var center = ol.extent.getCenter(this.getBounds()),
        resultY = center[1],
        vertices = this.rings[0].getCoordinates(),
        intersections = [],
        maxLength = 0,
        i, vertex1, vertex2, x, segmentLength, resultX;

    // Calculate intersections with the horizontal bounding box center line
    for (i = vertices.length - 1; i >= 1; --i) {
      vertex1 = vertices[i];
      vertex2 = vertices[i - 1];
      if ((vertex1[1] >= resultY && vertex2[1] <= resultY) ||
          (vertex1[1] <= resultY && vertex2[1] >= resultY)) {
        x = (resultY - vertex1[1]) / (vertex2[1] - vertex1[1]) *
            (vertex2[0] - vertex1[0]) + vertex1[0];
        intersections.push(x);
      }
    }

    // Find the longest segment of the horizontal bounding box center line that
    // has its center point inside the polygon
    intersections.sort();
    for (i = intersections.length - 1; i >= 1; --i) {
      segmentLength = Math.abs(intersections[i] - intersections[i - 1]);
      if (segmentLength > maxLength) {
        x = (intersections[i] + intersections[i - 1]) / 2;
        if (this.containsCoordinate([x, resultY])) {
          maxLength = segmentLength;
          resultX = x;
        }
      }
    }
    this.labelPoint_ = [resultX, resultY];
  }

  return this.labelPoint_;
};
