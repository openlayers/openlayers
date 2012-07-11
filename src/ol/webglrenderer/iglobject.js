goog.provide('ol.webglrenderer.IGLObject');



/**
 * @interface
 */
ol.webglrenderer.IGLObject = function() {};


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webglrenderer.IGLObject.prototype.getGL = function() {};


/**
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webglrenderer.IGLObject.prototype.setGL = function(gl) {};
