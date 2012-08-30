/**
 * @externs
 * @see http://www.khronos.org/webgl/wiki/Debugging
 * @see http://www.khronos.org/webgl/wiki/HandlingContextLost
 */



/**
 * @constructor
 * @extends {WebGLRenderingContext}
 */
var WebGLDebugRenderingContext = function() {};



/**
 * @constructor
 * @extends {HTMLCanvasElement}
 */
var WebGLDebugLostContextSimulatingCanvas = function() {};


/**
 * @nosideeffects
 * @return {number}
 */
WebGLDebugLostContextSimulatingCanvas.prototype.getNumCalls = function() {};


/**
 */
WebGLDebugLostContextSimulatingCanvas.prototype.loseContext = function() {};


/**
 * @param {number} numCalls
 */
WebGLDebugLostContextSimulatingCanvas.prototype.loseContextInNCalls =
    function(numCalls) {};


/**
 */
WebGLDebugLostContextSimulatingCanvas.prototype.restoreContext = function() {};


/**
 * @param {number} timeout
 */
WebGLDebugLostContextSimulatingCanvas.prototype.setRestoreTimeout =
    function(timeout) {};


/**
 * @type {Object}
 */
var WebGLDebugUtils = {};


/**
 * @nosideeffects
 * @param {number} value
 * @return {string}
 */
WebGLDebugUtils.glEnumToString = function(value) {};


/**
 * @nosideeffects
 * @param {string} functionName
 * @param {Array} args Args.
 * @return {string} String.
 */
WebGLDebugUtils.glFunctionArgsToString = function(functionName, args) {};


/**
 * @param {WebGLRenderingContext} ctx
 */
WebGLDebugUtils.init = function(ctx) {};


/**
 * @param {HTMLCanvasElement} canvas
 * @return {WebGLDebugLostContextSimulatingCanvas}
 */
WebGLDebugUtils.makeLostContextSimulatingCanvas = function(canvas) {};


/**
 * @param {WebGLRenderingContext} context
 * @param {Function=} opt_onErrorFunc
 * @param {Function=} opt_onFunc
 * @return {WebGLDebugRenderingContext}
 */
WebGLDebugUtils.makeDebugContext =
    function(context, opt_onErrorFunc, opt_onFunc) {};
