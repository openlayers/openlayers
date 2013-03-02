goog.provide('ol.geom.MultiPoint');

goog.require('goog.asserts');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {ol.geom.VertexArray} coordinates Coordinates array.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.MultiPoint = function(coordinates, opt_shared) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0]));

  var vertices = opt_shared,
      dimension;

  if (!goog.isDef(vertices)) {
    // try to get dimension from first vertex
    dimension = coordinates[0].length;
    vertices = new ol.geom.SharedVertices({dimension: dimension});
  }

  /**
   * @type {ol.geom.SharedVertices}
   */
  this.vertices = vertices;

  var numParts = coordinates.length;

  /**
   * @type {Array.<ol.geom.Point>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Point(coordinates[i], vertices);
  }

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();

};
goog.inherits(ol.geom.MultiPoint, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.GeometryType.MULTIPOINT;
};


/**
 * Create a multi-point geometry from an array of point geometries.
 *
 * @param {Array.<ol.geom.Point>} geometries Array of geometries.
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 * @return {ol.geom.MultiPoint} A new geometry.
 */
ol.geom.MultiPoint.fromParts = function(geometries, opt_shared) {
  var count = geometries.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = geometries[i].getCoordinates();
  }
  return new ol.geom.MultiPoint(coordinates, opt_shared);
};
