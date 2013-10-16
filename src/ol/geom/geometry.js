goog.provide('ol.geom.Geometry');
goog.provide('ol.geom.GeometryEvent');
goog.provide('ol.geom.GeometryType');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('ol.Extent');
goog.require('ol.TransformFunction');



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @todo stability experimental
 */
ol.geom.Geometry = function() {
  goog.base(this);
};
goog.inherits(ol.geom.Geometry, goog.events.EventTarget);


/**
 * Create a clone of this geometry.
 * @return {ol.geom.Geometry} The cloned geometry.
 */
ol.geom.Geometry.prototype.clone = function() {
  return new this.constructor(this.getCoordinates());
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
 * Constructor for geometry events.
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {ol.geom.Geometry} target The target geometry.
 * @param {ol.Extent} oldExtent The previous geometry extent.
 */
ol.geom.GeometryEvent = function(type, target, oldExtent) {
  goog.base(this, type, target);

  this.oldExtent = oldExtent;
};
goog.inherits(ol.geom.GeometryEvent, goog.events.Event);


/**
 * Geometry types.
 *
 * @enum {string}
 * @todo stability experimental
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
