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
 * @param {Element} canvas Canvas.
 * @param {Object=} opt_attributes Attributes.
 * @return {WebGLRenderingContext} WebGL rendering context.
 */
ol.webgl.getContext = function(canvas, opt_attributes) {
  return canvas.getContext('experimental-webgl', opt_attributes);
};


/**
 * @return {boolean} Is supported.
 */
ol.webgl.isSupported = function() {
  if (!('WebGLRenderingContext' in goog.global)) {
    return false;
  }
  try {
    var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
    return !goog.isNull(canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
};
