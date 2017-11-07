
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
 * @type {!Array.<number>|undefined}
 */
GeoJSONObject.prototype.bbox;


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
 */
var GeoJSONCRS = function() {};


/**
 * CRS type. One of `link` or `name`.
 * @type {string}
 */
GeoJSONCRS.prototype.type;


/**
 * @type {!GeoJSONCRSName|!GeoJSONLink}
 */
GeoJSONCRS.prototype.properties;


/**
 * @constructor
 */
var GeoJSONCRSName = function() {};


/**
 * @type {string}
 */
GeoJSONCRSName.prototype.name;



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
 * @type {GeoJSONGeometry|GeoJSONGeometryCollection}
 */
GeoJSONFeature.prototype.geometry;


/**
 * @type {number|string|undefined}
 */
GeoJSONFeature.prototype.id;


/**
 * @type {Object.<string, *>}
 */
GeoJSONFeature.prototype.properties;


/**
 * @type {string|undefined}
 */
GeoJSONFeature.prototype.geometry_name;


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
 * @constructor
 */
var GeoJSONLink = function() {};


/**
 * @type {string}
 */
GeoJSONLink.prototype.href;

/**
 * @type {string}
 */
GeoJSONLink.prototype.type;
