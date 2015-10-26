goog.provide('ol.webgl');
goog.provide('ol.webgl.WebGLContextEventType');


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
ol.webgl.CONTEXT_IDS_ = [
  'experimental-webgl',
  'webgl',
  'webkit-3d',
  'moz-webgl'
];


/**
 * @enum {string}
 */
ol.webgl.WebGLContextEventType = {
  LOST: 'webglcontextlost',
  RESTORED: 'webglcontextrestored'
};


/**
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {Object=} opt_attributes Attributes.
 * @return {WebGLRenderingContext} WebGL rendering context.
 */
ol.webgl.getContext = function(canvas, opt_attributes) {
  var context, i, ii = ol.webgl.CONTEXT_IDS_.length;
  for (i = 0; i < ii; ++i) {
    try {
      context = canvas.getContext(ol.webgl.CONTEXT_IDS_[i], opt_attributes);
      if (context) {
        return /** @type {!WebGLRenderingContext} */ (context);
      }
    } catch (e) {
    }
  }
  return null;
};
