/**
 * @externs
 * @see http://proj4js.org/
 */


/**
 * @param {...*} var_args
 * @return {undefined|Array.<number>|Object.<{
 *     forward: function(Array.<number>): Array.<number>,
 *     inverse: function(Array.<number>): Array.<number>}>}
 */
var proj4 = function(var_args) {};


/**
 * @param {string} name
 * @param {(string|Object)=} opt_def
 * @return {undefined|Object.<string, Object.<{axis: string, units: string,
 *     to_meter: number}>>}
 */
proj4.defs = function(name, opt_def) {};
