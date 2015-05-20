/**
 * @externs
 * @see http://msdn.microsoft.com/en-us/library/y39d47w8(v=vs.94).aspx
 */



/**
 * FIXME check argument type
 * @constructor
 * @param {VBArray|string} safeArray
 */
var VBArray = function(safeArray) {};


/**
 * @return {number}
 */
VBArray.prototype.dimensions = function() {};


/**
 * @param {...number} var_args
 * @return {*}
 */
VBArray.prototype.getItem = function(var_args) {};


/**
 * @param {number=} opt_dimension
 * @return {*}
 */
VBArray.prototype.lbound = function(opt_dimension) {};


/**
 * @return {Array.<number>}
 */
VBArray.prototype.toArray = function() {};


/**
 * @param {number=} opt_dimension
 * @return {*}
 */
VBArray.prototype.ubound = function(opt_dimension) {};
