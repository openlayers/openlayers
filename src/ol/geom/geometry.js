goog.provide('ol.geom.Geometry');
goog.provide('ol.geom.GeometryType');

goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Extent');
goog.require('ol.Observable');
goog.require('ol.TransformFunction');


/**
 * Geometry types.
 *
 * @enum {string}
 * @todo stability stable
 */
ol.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection'
};



/**
 * @constructor
 * @extends {ol.Observable}
 * @todo stability experimental
 */
ol.geom.Geometry = function() {
  goog.base(this);
};
goog.inherits(ol.geom.Geometry, ol.Observable);


/**
 * Create a clone of this geometry.
 * @return {ol.geom.Geometry} The cloned geometry.
 */
ol.geom.Geometry.prototype.clone = function() {
  return new this.constructor(goog.object.unsafeClone(this.getCoordinates()));
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
 * Dispatch a generic event with type "change."
 */
ol.geom.Geometry.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};
