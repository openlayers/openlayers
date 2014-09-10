
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
 * @type {!GeoJSONCRSCode|!GeoJSONCRSName|!GeoJSONLink}
 * TODO: remove GeoJSONCRSCode when http://jira.codehaus.org/browse/GEOS-5996
 * is fixed and widely deployed.
 */
GeoJSONCRS.prototype.properties;



/**
 * `GeoJSONCRSCode` is not part of the GeoJSON specification, but is generated
 * by GeoServer.
 * TODO: remove GeoJSONCRSCode when http://jira.codehaus.org/browse/GEOS-5996
 * is fixed and widely deployed.
 * @constructor
 */
var GeoJSONCRSCode = function() {};



/**
 * @constructor
 */
var GeoJSONCRSName = function() {};


/**
 * @type {string}
 * TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996 is fixed
 * and widely deployed.
 */
GeoJSONCRSName.prototype.code;


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
 * @type {GeoJSONGeometry}
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



/**
 * @constructor
 * @extends {GeoJSONObject}
 */
var GeoJSONLink = function() {};


/**
 * @type {string}
 */
GeoJSONLink.prototype.href;
