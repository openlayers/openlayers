/**
 * @externs
 * @see http://proj4js.org/
 */


/**
 * @constructor
 */
var proj4 = function() {};


/**
 * @type {function(Array.<number>): Array.<number>}
 */
proj4.prototype.forward;


/**
 * @type {function(Array.<number>): Array.<number>}
 */
proj4.prototype.inverse;


/**
 * @param {string} name
 * @param {(string|Object)=} opt_def
 * @return {undefined|Object.<string, Object.<{axis: string, units: string,
 *     to_meter: number}>>}
 */
proj4.defs = function(name, opt_def) {};
