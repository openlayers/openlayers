goog.provide('ol.webgl.IGLObject');



/**
 * @interface
 */
ol.webgl.IGLObject = function() {};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webgl.IGLObject.prototype.getGL = function() {};


/**
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webgl.IGLObject.prototype.setGL = function(gl) {};
