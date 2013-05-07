goog.provide('ol.geom.Polygon');

goog.require('goog.asserts');
goog.require('ol.Extent');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
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
   * @type {ol.geom.SharedVertices}
   */
  this.vertices = vertices;

  var numRings = coordinates.length;

  /**
   * @type {Array.<ol.geom.LinearRing>}
   */
  this.rings = new Array(numRings);
  for (var i = 0; i < numRings; ++i) {
    this.rings[i] = new ol.geom.LinearRing(coordinates[i], vertices);
  }

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();
  goog.asserts.assert(this.dimension >= 2);

  /**
   * @type {ol.Extent}
   * @private
   */
  this.bounds_ = null;

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
