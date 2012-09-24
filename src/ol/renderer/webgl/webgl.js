goog.provide('ol.renderer.webgl');


/**
 * @define {boolean} Free resources immediately.
 */
ol.renderer.webgl.FREE_RESOURCES_IMMEDIATELY = false;


/**
 * @return {boolean} Is supported.
 */
ol.renderer.webgl.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};
