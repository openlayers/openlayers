
/**
 * @fileoverview Externs for EsriJSON.
 * @see http://resources.arcgis.com/en/help/rest/apiref/geometry.html
 * @externs
 */



/**
 * @constructor
 */
var EsriJSONObject = function() {};


/**
 * @type {!EsriJSONCRS}
 */
EsriJSONObject.prototype.spatialReference;



/**
 * @constructor
 */
var EsriJSONCRS = function() {};


/**
 * CRS well know identifier.
 * @type {number}
 */
EsriJSONCRS.prototype.wkid;



/**
 * @constructor
 * @extends {EsriJSONObject}
 */
var EsriJSONPoint = function() {};


/**
 * M value of point.
 * @type {number}
 */
EsriJSONPoint.prototype.m;


/**
 * X coordinate of point.
 * @type {number}
 */
EsriJSONPoint.prototype.x;



/**
 * Y coordinate of point.
 * @type {number}
 */
EsriJSONPoint.prototype.y;


/**
 * Z coordinate of point.
 * @type {number|undefined}
 */
EsriJSONPoint.prototype.z;


/**
 * @constructor
 * @extends {EsriJSONObject}
 */
var EsriJSONMultipoint = function() {};


/**
 * Does Multipoint have M values?
 * @type {boolean|undefined}
 */
EsriJSONMultipoint.prototype.hasM;


/**
 * Does Multipoint have Z values?
 * @type {boolean|undefined}
 */
EsriJSONMultipoint.prototype.hasZ;


/**
 * @type {!Array.<!Array.<number>>}
 */
EsriJSONMultipoint.prototype.points;


/**
 * @constructor
 * @extends {EsriJSONObject}
 */
var EsriJSONPolyline = function() {};


/**
 * Does Polyline have M values?
 * @type {boolean|undefined}
 */
EsriJSONPolyline.prototype.hasM;


/**
 * Does Polyline have Z values?
 * @type {boolean|undefined}
 */
EsriJSONPolyline.prototype.hasZ;


/**
 * @type {!Array.<!Array.<!Array.<number>>>}
 */
EsriJSONPolyline.prototype.paths;


/**
 * @constructor
 * @extends {EsriJSONObject}
 */
var EsriJSONPolygon = function() {};


/**
 * Does Polygon have M values?
 * @type {boolean|undefined}
 */
EsriJSONPolygon.prototype.hasM;


/**
 * Does Polygon have Z values?
 * @type {boolean|undefined}
 */
EsriJSONPolygon.prototype.hasZ;


/**
 * @type {!Array.<!Array.<!Array.<number>>>}
 */
EsriJSONPolygon.prototype.rings;


/**
 * @typedef {(EsriJSONPoint|EsriJSONMultipoint|EsriJSONPolyline|
           EsriJSONPolygon)}
 */
var EsriJSONGeometry;


/**
 * @constructor
 * @extends {EsriJSONObject}
 */
var EsriJSONFeature = function() {};


/**
 * @type {EsriJSONGeometry}
 */
EsriJSONFeature.prototype.geometry;


/**
 * @type {Object.<string, *>}
 */
EsriJSONFeature.prototype.attributes;



/**
 * @constructor
 * @extends {EsriJSONObject}
 */
var EsriJSONFeatureCollection = function() {};


/**
 * @type {!Array.<EsriJSONFeature>}
 */
EsriJSONFeatureCollection.prototype.features;


/**
 * The name of the attribute that contains ids.
 * @type {string}
 */
EsriJSONFeatureCollection.prototype.objectIdFieldName;
