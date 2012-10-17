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
