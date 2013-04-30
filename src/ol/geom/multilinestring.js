goog.provide('ol.geom.MultiLineString');

goog.require('goog.asserts');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {Array.<ol.geom.VertexArray>} coordinates Coordinates array.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.MultiLineString = function(coordinates, opt_shared) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0][0]));

  var vertices = opt_shared,
      dimension;

  if (!goog.isDef(vertices)) {
    // try to get dimension from first vertex in first line
    dimension = coordinates[0][0].length;
    vertices = new ol.geom.SharedVertices({dimension: dimension});
  }

  var numParts = coordinates.length;

  /**
   * @type {Array.<ol.geom.LineString>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.LineString(coordinates[i], vertices);
  }

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();

};
goog.inherits(ol.geom.MultiLineString, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.getType = function() {
  return ol.geom.GeometryType.MULTILINESTRING;
};


/**
 * Calculate the distance from a coordinate to this multilinestring. This is
 * the closest distance of the coordinate to one of this multilinestring's
 * components.<
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {number} Distance from the coordinate to this multilinestring.
 */
ol.geom.MultiLineString.prototype.distanceFromCoordinate =
    function(coordinate) {
  var distance = Infinity;
  for (var i = 0, ii = this.components.length; i < ii; ++i) {
    distance = Math.min(distance,
        this.components[i].distanceFromCoordinate(coordinate));
  }
  return distance;
};


/**
 * Create a multi-linestring geometry from an array of linestring geometries.
 *
 * @param {Array.<ol.geom.LineString>} geometries Array of geometries.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 * @return {ol.geom.MultiLineString} A new geometry.
 */
ol.geom.MultiLineString.fromParts = function(geometries, opt_shared) {
  var count = geometries.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = geometries[i].getCoordinates();
  }
  return new ol.geom.MultiLineString(coordinates, opt_shared);
};
