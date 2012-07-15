/**
 * @externs
 */



/**
 * @constructor
 * @extends {WebGLRenderingContext}
 */
var WebGLDebugRenderingContext = function() {};


/**
 * @type {Object}
 */
var WebGLDebugUtils = {};


/**
 * @param {number} glEnum GL enum.
 * @return {string} String.
 */
WebGLDebugUtils.glEnumToString = function(glEnum) {
  return '';
};


/**
 * @param {string} functionName Function name.
 * @param {Array} args Args.
 * @return {string} String.
 */
WebGLDebugUtils.glFunctionArgsToString = function(functionName, args) {
  return '';
};


/**
 * @param {WebGLRenderingContext} context Context.
 */
WebGLDebugUtils.init = function(context) {
};


/**
 * @param {WebGLRenderingContext} context Context.
 * @param {Function=} opt_onErrorFunc On error function.
 * @param {Function=} opt_onFunc On function.
 * @return {WebGLDebugRenderingContext} Context.
 */
WebGLDebugUtils.makeDebugContext = function(
    context, opt_onErrorFunc, opt_onFunc) {
  return null;
};
