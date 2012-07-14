goog.provide('ol.webgl');


/**
 * @return {boolean} Is supported.
 */
ol.webgl.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};
