
/**
 * @fileoverview Externs for GeoJSON.
 * @see http://geojson.org/geojson-spec.html
 * @externs
 */



/**
 * @constructor
 */
var GeoJSONObject = function() {};


/**
 * @type {string}
 */
GeoJSONObject.prototype.type;


/**
 * @type {!GeoJSONCRS|undefined}
 */
GeoJSONObject.prototype.crs;



/**
 * @constructor
 * @extends {GeoJSONObject}
 */
var GeoJSONCRS = function() {};


/**
 * @type {!Object.<string, *>}
 */
GeoJSONCRS.prototype.properties;



/**
 * @constructor
 * @extends {GeoJSONObject}
 */
var GeoJSONGeometry = function() {};


/**
 * @type {!Array.<number>|!Array.<!Array.<number>>|
 *        !Array.<!Array.<!Array.<number>>>}
 */
GeoJSONGeometry.prototype.coordinates;



/**
 * @constructor
 * @extends {GeoJSONObject}
 */
var GeoJSONGeometryCollection = function() {};


/**
 * @type {!Array.<GeoJSONGeometry>}
 */
GeoJSONGeometryCollection.prototype.geometries;



/**
 * @constructor
 * @extends {GeoJSONObject}
 */
var GeoJSONFeature = function() {};


/**
 * @type {GeoJSONGeometry}
 */
GeoJSONFeature.prototype.geometry;


/**
 * @type {Object.<string, *>}
 */
GeoJSONFeature.prototype.properties;



/**
 * @constructor
 * @extends {GeoJSONObject}
 */
var GeoJSONFeatureCollection = function() {};


/**
 * @type {!Array.<GeoJSONFeature>}
 */
GeoJSONFeatureCollection.prototype.features;


/**
 * @type {!Array.<number>|undefined}
 */
GeoJSONFeatureCollection.prototype.bbox;
