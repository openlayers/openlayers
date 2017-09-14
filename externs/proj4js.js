/**
 * @externs
 * @see http://proj4js.org/
 */


/**
 * @constructor
 */
var Proj4 = function() {};


/**
 * @param {ol.Coordinate} coordinates
 * @return {ol.Coordinate}
 */
Proj4.prototype.forward = function(coordinates) {};


/**
 * @param {ol.Coordinate} coordinates
 * @return {ol.Coordinate}
 */
Proj4.prototype.inverse = function(coordinates) {};


/**
 * @param {string} name
 * @param {(string|Object)=} opt_def
 * @return {undefined|Object.<string, Object.<{axis: string, units: string, to_meter: number}>>}
 */
Proj4.prototype.defs = function(name, opt_def) {};

/**
 * @type {Proj4}
 */
var proj4;
