goog.provide('ol.renderer.webgl');


/**
 * @define {boolean} Free resources immediately.
 */
ol.renderer.webgl.FREE_RESOURCES_IMMEDIATELY = false;


/**
 * @return {boolean} Is supported.
 */
ol.renderer.webgl.isSupported = function() {
  if (!('WebGLRenderingContext' in goog.global)) {
    return false;
  }
  var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
  return !goog.isNull(canvas.getContext('experimental-webgl'));
};
