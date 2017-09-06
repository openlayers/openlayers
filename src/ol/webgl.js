var _ol_webgl_ = {};

/**
 * Constants taken from goog.webgl
 */


/**
 * @const
 * @type {number}
 */
_ol_webgl_.ONE = 1;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.SRC_ALPHA = 0x0302;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.COLOR_ATTACHMENT0 = 0x8CE0;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.COLOR_BUFFER_BIT = 0x00004000;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TRIANGLES = 0x0004;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TRIANGLE_STRIP = 0x0005;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.ONE_MINUS_SRC_ALPHA = 0x0303;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.ARRAY_BUFFER = 0x8892;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.ELEMENT_ARRAY_BUFFER = 0x8893;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.STREAM_DRAW = 0x88E0;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.STATIC_DRAW = 0x88E4;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.DYNAMIC_DRAW = 0x88E8;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.CULL_FACE = 0x0B44;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.BLEND = 0x0BE2;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.STENCIL_TEST = 0x0B90;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.DEPTH_TEST = 0x0B71;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.SCISSOR_TEST = 0x0C11;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.UNSIGNED_BYTE = 0x1401;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.UNSIGNED_SHORT = 0x1403;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.UNSIGNED_INT = 0x1405;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.FLOAT = 0x1406;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.RGBA = 0x1908;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.FRAGMENT_SHADER = 0x8B30;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.VERTEX_SHADER = 0x8B31;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.LINK_STATUS = 0x8B82;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.LINEAR = 0x2601;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TEXTURE_MAG_FILTER = 0x2800;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TEXTURE_MIN_FILTER = 0x2801;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TEXTURE_WRAP_S = 0x2802;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TEXTURE_WRAP_T = 0x2803;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TEXTURE_2D = 0x0DE1;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.TEXTURE0 = 0x84C0;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.CLAMP_TO_EDGE = 0x812F;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.COMPILE_STATUS = 0x8B81;


/**
 * @const
 * @type {number}
 */
_ol_webgl_.FRAMEBUFFER = 0x8D40;


/** end of goog.webgl constants
 */


/**
 * @const
 * @private
 * @type {Array.<string>}
 */
_ol_webgl_.CONTEXT_IDS_ = [
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
_ol_webgl_.getContext = function(canvas, opt_attributes) {
  var context, i, ii = _ol_webgl_.CONTEXT_IDS_.length;
  for (i = 0; i < ii; ++i) {
    try {
      context = canvas.getContext(_ol_webgl_.CONTEXT_IDS_[i], opt_attributes);
      if (context) {
        return /** @type {!WebGLRenderingContext} */ (context);
      }
    } catch (e) {
      // pass
    }
  }
  return null;
};
export default _ol_webgl_;
