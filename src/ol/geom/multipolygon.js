goog.provide('ol.geom.MultiPolygon');

goog.require('goog.asserts');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {Array.<Array.<ol.geom.VertexArray>>} coordinates Coordinates
 *    array.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.MultiPolygon = function(coordinates, opt_shared) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0][0][0]));

  var vertices = opt_shared,
      dimension;

  if (!goog.isDef(vertices)) {
    // try to get dimension from first vertex in first ring of the first poly
    dimension = coordinates[0][0][0].length;
    vertices = new ol.geom.SharedVertices({dimension: dimension});
  }

  var numParts = coordinates.length;

  /**
   * @type {Array.<ol.geom.Polygon>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Polygon(coordinates[i], vertices);
  }

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();

};
goog.inherits(ol.geom.MultiPolygon, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTIPOLYGON;
};


/**
 * Check whether a given coordinate is inside this multipolygon.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Whether the coordinate is inside the multipolygon.
 */
ol.geom.MultiPolygon.prototype.containsCoordinate = function(coordinate) {
  var containsCoordinate = false;
  for (var i = 0, ii = this.components.length; i < ii; ++i) {
    if (this.components[i].containsCoordinate(coordinate)) {
      containsCoordinate = true;
      break;
    }
  }
  return containsCoordinate;
};


/**
 * Create a multi-polygon geometry from an array of polygon geometries.
 *
 * @param {Array.<ol.geom.Polygon>} geometries Array of geometries.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 * @return {ol.geom.MultiPolygon} A new geometry.
 */
ol.geom.MultiPolygon.fromParts = function(geometries, opt_shared) {
  var count = geometries.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = geometries[i].getCoordinates();
  }
  return new ol.geom.MultiPolygon(coordinates, opt_shared);
};
