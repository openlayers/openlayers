
/**
 * @fileoverview Externs for TopoJSON.
 * @see https://github.com/mbostock/topojson/wiki/Specification
 * @externs
 */



/**
 * @constructor
 */
var TopoJSONTopology = function() {};


/**
 * @type {string}
 */
TopoJSONTopology.prototype.type;


/**
 * @type {TopoJSONTransform|undefined}
 */
TopoJSONTopology.prototype.transform;


/**
 * @type {Object.<string, (TopoJSONGeometry|TopoJSONGeometryCollection)>}
 */
TopoJSONTopology.prototype.objects;


/**
 * @type {!Array.<Array.<Array.<number>>>}
 */
TopoJSONTopology.prototype.arcs;



/**
 * @constructor
 */
var TopoJSONTransform = function() {};


/**
 * @type {!Array.<number>}
 */
TopoJSONTransform.prototype.scale;


/**
 * @type {!Array.<number>}
 */
TopoJSONTransform.prototype.translate;



/**
 * @constructor
 */
var TopoJSONGeometry = function() {};


/**
 * @type {string}
 */
TopoJSONGeometry.prototype.type;


/**
 * @type {string|number|undefined}
 */
TopoJSONGeometry.prototype.id;



/**
 * @constructor
 */
var TopoJSONGeometryCollection = function() {};


/**
 * @type {Array.<TopoJSONGeometry>}
 */
TopoJSONGeometryCollection.prototype.geometries;



/**
 * @constructor
 * @extends {TopoJSONGeometry}
 */
var TopoJSONPoint = function() {};


/**
 * @type {!Array.<number>}
 */
TopoJSONPoint.prototype.coordinates;



/**
 * @constructor
 * @extends {TopoJSONGeometry}
 */
var TopoJSONLineString = function() {};


/**
 * @type {!Array.<number>}
 */
TopoJSONLineString.prototype.arcs;



/**
 * @constructor
 * @extends {TopoJSONGeometry}
 */
var TopoJSONPolygon = function() {};


/**
 * @type {!Array.<Array.<number>>}
 */
TopoJSONPolygon.prototype.arcs;



/**
 * @constructor
 * @extends {TopoJSONGeometry}
 */
var TopoJSONMultiPoint = function() {};


/**
 * @type {!Array.<Array.<number>>}
 */
TopoJSONMultiPoint.prototype.coordinates;



/**
 * @constructor
 * @extends {TopoJSONGeometry}
 */
var TopoJSONMultiLineString = function() {};


/**
 * @type {!Array.<Array.<number>>}
 */
TopoJSONMultiLineString.prototype.arcs;



/**
 * @constructor
 * @extends {TopoJSONGeometry}
 */
var TopoJSONMultiPolygon = function() {};


/**
 * @type {!Array.<Array.<Array.<number>>>}
 */
TopoJSONMultiPolygon.prototype.arcs;
