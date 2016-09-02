goog.provide('ol.webgl');


/** Constants taken from goog.webgl
 */


/**
 * @const
 * @type {number}
 */
ol.webgl.ONE = 1;


/**
 * @const
 * @type {number}
 */
ol.webgl.SRC_ALPHA = 0x0302;


/**
 * @const
 * @type {number}
 */
ol.webgl.COLOR_ATTACHMENT0 = 0x8CE0;


/**
 * @const
 * @type {number}
 */
ol.webgl.COLOR_BUFFER_BIT = 0x00004000;


/**
 * @const
 * @type {number}
 */
ol.webgl.TRIANGLES = 0x0004;


/**
 * @const
 * @type {number}
 */
ol.webgl.TRIANGLE_STRIP = 0x0005;


/**
 * @const
 * @type {number}
 */
ol.webgl.ONE_MINUS_SRC_ALPHA = 0x0303;


/**
 * @const
 * @type {number}
 */
ol.webgl.ARRAY_BUFFER = 0x8892;


/**
 * @const
 * @type {number}
 */
ol.webgl.ELEMENT_ARRAY_BUFFER = 0x8893;


/**
 * @const
 * @type {number}
 */
ol.webgl.STREAM_DRAW = 0x88E0;


/**
 * @const
 * @type {number}
 */
ol.webgl.STATIC_DRAW = 0x88E4;


/**
 * @const
 * @type {number}
 */
ol.webgl.DYNAMIC_DRAW = 0x88E8;


/**
 * @const
 * @type {number}
 */
ol.webgl.CULL_FACE = 0x0B44;


/**
 * @const
 * @type {number}
 */
ol.webgl.BLEND = 0x0BE2;


/**
 * @const
 * @type {number}
 */
ol.webgl.STENCIL_TEST = 0x0B90;


/**
 * @const
 * @type {number}
 */
ol.webgl.DEPTH_TEST = 0x0B71;


/**
 * @const
 * @type {number}
 */
ol.webgl.SCISSOR_TEST = 0x0C11;


/**
 * @const
 * @type {number}
 */
ol.webgl.UNSIGNED_BYTE = 0x1401;


/**
 * @const
 * @type {number}
 */
ol.webgl.UNSIGNED_SHORT = 0x1403;


/**
 * @const
 * @type {number}
 */
ol.webgl.UNSIGNED_INT = 0x1405;


/**
 * @const
 * @type {number}
 */
ol.webgl.FLOAT = 0x1406;


/**
 * @const
 * @type {number}
 */
ol.webgl.RGBA = 0x1908;


/**
 * @const
 * @type {number}
 */
ol.webgl.FRAGMENT_SHADER = 0x8B30;


/**
 * @const
 * @type {number}
 */
ol.webgl.VERTEX_SHADER = 0x8B31;


/**
 * @const
 * @type {number}
 */
ol.webgl.LINK_STATUS = 0x8B82;


/**
 * @const
 * @type {number}
 */
ol.webgl.LINEAR = 0x2601;


/**
 * @const
 * @type {number}
 */
ol.webgl.TEXTURE_MAG_FILTER = 0x2800;


/**
 * @const
 * @type {number}
 */
ol.webgl.TEXTURE_MIN_FILTER = 0x2801;


/**
 * @const
 * @type {number}
 */
ol.webgl.TEXTURE_WRAP_S = 0x2802;


/**
 * @const
 * @type {number}
 */
ol.webgl.TEXTURE_WRAP_T = 0x2803;


/**
 * @const
 * @type {number}
 */
ol.webgl.TEXTURE_2D = 0x0DE1;


/**
 * @const
 * @type {number}
 */
ol.webgl.TEXTURE0 = 0x84C0;


/**
 * @const
 * @type {number}
 */
ol.webgl.CLAMP_TO_EDGE = 0x812F;


/**
 * @const
 * @type {number}
 */
ol.webgl.COMPILE_STATUS = 0x8B81;


/**
 * @const
 * @type {number}
 */
ol.webgl.FRAMEBUFFER = 0x8D40;


/** end of goog.webgl constants
 */


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
      // pass
    }
  }
  return null;
};
