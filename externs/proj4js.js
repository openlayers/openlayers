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
 * @param {number} x X.
 * @param {number} y Y.
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
 * @param {string} srsCode SRS code.
 * @param {Function=} callback Callback.
 */
Proj4js.Proj = function(srsCode, callback) {};


/**
 * @type {string}
 */
Proj4js.Proj.prototype.title;


/**
 * @type {string}
 */
Proj4js.Proj.prototype.units;


/**
 * @param {Proj4js.Proj} source Source projection.
 * @param {Proj4js.Proj} dest Destination projection.
 * @param {Proj4js.Point|{x:number, y:number}} point Point.
 * @return {Proj4js.Point} Point.
 */
Proj4js.transform = function(source, dest, point) {
  return new Proj4js.Point(0, 0);
};
