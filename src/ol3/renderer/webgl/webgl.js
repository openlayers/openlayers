goog.provide('ol3.renderer.webgl');


/**
 * @define {boolean} Free resources immediately.
 */
ol3.renderer.webgl.FREE_RESOURCES_IMMEDIATELY = false;


/**
 * @return {boolean} Is supported.
 */
ol3.renderer.webgl.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};
