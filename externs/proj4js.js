/**
 * @externs
 * @see http://trac.osgeo.org/proj4js/
 */


/**
 * @type {Object}
 */
var Proj4js = {};


/**
 * @type {Object.<string, string>}
 */
Proj4js.defs;


/**
 * @type {function(string)}
 */
Proj4js.reportError;



/**
 * @constructor
 * @param {number} x
 * @param {number} y
 */
Proj4js.Point = function(x, y) {};


/**
 * @type {number}
 */
Proj4js.Point.prototype.x;


/**
 * @type {number}
 */
Proj4js.Point.prototype.y;



/**
 * @constructor
 * @param {string} srsCode
 * @param {Function=} opt_callback
 */
Proj4js.Proj = function(srsCode, opt_callback) {};


/**
 * @type {string}
 */
Proj4js.Proj.prototype.axis;


/**
 * @type {string}
 */
Proj4js.Proj.prototype.title;


/**
 * @type {string}
 */
Proj4js.Proj.prototype.units;


/**
 * @type {string}
 */
Proj4js.Proj.prototype.srsCode;


/**
 * @type {number}
 */
Proj4js.Proj.prototype.to_meter;


/**
 * @nosideeffects
 * @param {Proj4js.Proj} source
 * @param {Proj4js.Proj} dest
 * @param {Proj4js.Point|{x:number, y:number}} point
 * @return {Proj4js.Point}
 */
Proj4js.transform = function(source, dest, point) {};
