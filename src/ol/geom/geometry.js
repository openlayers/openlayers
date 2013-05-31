goog.provide('ol.geom.Geometry');
goog.provide('ol.geom.GeometryType');

goog.require('ol.Extent');
goog.require('ol.geom.SharedVertices');



/**
 * @constructor
 */
ol.geom.Geometry = function() {

  /**
   * @type {ol.geom.SharedVertices}
   * @protected
   */
  this.vertices = null;

};


/**
 * The dimension of this geometry (2 or 3).
 * @type {number}
 */
ol.geom.Geometry.prototype.dimension;


/**
 * Get the rectangular 2D envelope for this geoemtry.
 * @return {ol.Extent} The bounding rectangular envelope.
 */
ol.geom.Geometry.prototype.getBounds = goog.abstractMethod;


/**
 * @return {Array} The GeoJSON style coordinates array for the geometry.
 */
ol.geom.Geometry.prototype.getCoordinates = goog.abstractMethod;


/**
 * Get the shared vertices for this geometry.
 * @return {ol.geom.SharedVertices} The shared vertices.
 */
ol.geom.Geometry.prototype.getSharedVertices = function() {
  return this.vertices;
};


/**
 * Get the geometry type.
 * @return {ol.geom.GeometryType} The geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * Geometry types.
 *
 * @enum {string}
 */
ol.geom.GeometryType = {
  POINT: 'point',
  LINESTRING: 'linestring',
  LINEARRING: 'linearring',
  POLYGON: 'polygon',
  MULTIPOINT: 'multipoint',
  MULTILINESTRING: 'multilinestring',
  MULTIPOLYGON: 'multipolygon',
  GEOMETRYCOLLECTION: 'geometrycollection'
};
