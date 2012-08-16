goog.provide('ol.webgl');
goog.provide('ol.webgl.WebGLContextEventType');


/**
 * @define {boolean} Free resources immediately.
 */
ol.webgl.FREE_RESOURCES_IMMEDIATELY = false;


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
