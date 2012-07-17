goog.provide('ol.webgl');
goog.provide('ol.webgl.WebGLContextEventType');


/**
 * @enum {string}
 */
ol.webgl.WebGLContextEventType = {
  LOST: 'webglcontextlost',
  RESTORED: 'webglcontextrestored'
};


/**
 * @return {boolean} Is supported.
 */
ol.webgl.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};
