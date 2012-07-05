
/**
 * @fileoverview Externs for GeoJSON.
 * @see http://geojson.org/geojson-spec.html
 * @externs
 */



/**
 * @constructor
 */
var GeoJSONCRS = function() {};


/**
 * @type {string}
 */
GeoJSONCRS.prototype.type;


/**
 * @type {!Object.<string, *>}
 */
GeoJSONCRS.prototype.properties;



/**
 * @constructor
 */
var GeoJSONGeometry = function() {};


/**
 * @type {string}
 */
GeoJSONGeometry.prototype.type;


/**
 * @type {!Array.<number>|!Array.<!Array.<number>>}
 */
GeoJSONGeometry.prototype.coordinates;



/**
 * @constructor
 */
var GeoJSONFeature = function() {};


/**
 * @type {string}
 */
GeoJSONFeature.prototype.type;


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
 */
var GeoJSONFeatureCollection = function() {};


/**
 * @type {string}
 */
GeoJSONFeatureCollection.prototype.type;


/**
 * @type {!Array.<GeoJSONFeature>}
 */
GeoJSONFeatureCollection.prototype.features;


/**
 * @type {!Array.<number>|undefined}
 */
GeoJSONFeatureCollection.prototype.bbox;


/**
 * @type {!GeoJSONCRS|undefined}
 */
GeoJSONFeatureCollection.prototype.crs;


/**
 * @type {!Object.<string, *>}
 */
GeoJSONFeatureCollection.prototype.properties;
