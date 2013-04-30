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
 * Check whether a given coordinate is inside this polygon.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Whether the coordinate is inside the polygon.
 */
ol.geom.Polygon.prototype.containsCoordinate = function(coordinate) {
  var rings = this.rings;
  var containsCoordinate = ol.geom.pointInPolygon(coordinate,
      rings[0].getCoordinates());
  if (containsCoordinate) {
    // if inner ring contains point, polygon does not contain it
    for (var i = 1, ii = rings.length; i < ii; ++i) {
      if (ol.geom.pointInPolygon(coordinate, rings[i].getCoordinates())) {
        containsCoordinate = false;
        break;
      }
    }
  }
  return containsCoordinate;
};
