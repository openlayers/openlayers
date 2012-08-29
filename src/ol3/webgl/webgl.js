goog.provide('ol3.webgl');
goog.provide('ol3.webgl.WebGLContextEventType');


/**
 * @define {boolean} Free resources immediately.
 */
ol3.webgl.FREE_RESOURCES_IMMEDIATELY = false;


/**
 * @enum {string}
 */
ol3.webgl.WebGLContextEventType = {
  LOST: 'webglcontextlost',
  RESTORED: 'webglcontextrestored'
};


/**
 * @return {boolean} Is supported.
 */
ol3.webgl.isSupported = function() {
  return 'WebGLRenderingContext' in goog.global;
};
