goog.provide('ol.geom.Geometry');
goog.provide('ol.geom.GeometryType');

goog.require('ol.Extent');
goog.require('ol.TransformFunction');



/**
 * @constructor
 */
ol.geom.Geometry = function() {};


/**
 * The dimension of this geometry (2 or 3).
 * @type {number}
 */
ol.geom.Geometry.prototype.dimension;


/**
 * Create a clone of this geometry.
 * @return {ol.geom.Geometry} The cloned geometry.
 */
ol.geom.Geometry.prototype.clone = function() {
  var clone = new this.constructor(this.getCoordinates());
  clone.dimension = this.dimension;
  return clone;
};


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
 * Get the geometry type.
 * @return {ol.geom.GeometryType} The geometry type.
 */
ol.geom.Geometry.prototype.getType = goog.abstractMethod;


/**
 * Transform a geometry in place.
 * @param {ol.TransformFunction} transform Transform function.
 */
ol.geom.Geometry.prototype.transform = goog.abstractMethod;


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
