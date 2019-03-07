/**
 * @module ol/webgl
 */


/**
 * Constants taken from goog.webgl
 */


/**
 * @const
 * @type {number}
 */
export const ONE = 1;


/**
 * @const
 * @type {number}
 */
export const SRC_ALPHA = 0x0302;


/**
 * @const
 * @type {number}
 */
export const COLOR_ATTACHMENT0 = 0x8CE0;


/**
 * @const
 * @type {number}
 */
export const COLOR_BUFFER_BIT = 0x00004000;


/**
 * @const
 * @type {number}
 */
export const TRIANGLES = 0x0004;


/**
 * @const
 * @type {number}
 */
export const TRIANGLE_STRIP = 0x0005;


/**
 * @const
 * @type {number}
 */
export const ONE_MINUS_SRC_ALPHA = 0x0303;


/**
 * @const
 * @type {number}
 */
export const ARRAY_BUFFER = 0x8892;


/**
 * @const
 * @type {number}
 */
export const ELEMENT_ARRAY_BUFFER = 0x8893;


/**
 * @const
 * @type {number}
 */
export const STREAM_DRAW = 0x88E0;


/**
 * @const
 * @type {number}
 */
export const STATIC_DRAW = 0x88E4;


/**
 * @const
 * @type {number}
 */
export const DYNAMIC_DRAW = 0x88E8;


/**
 * @const
 * @type {number}
 */
export const CULL_FACE = 0x0B44;


/**
 * @const
 * @type {number}
 */
export const BLEND = 0x0BE2;


/**
 * @const
 * @type {number}
 */
export const STENCIL_TEST = 0x0B90;


/**
 * @const
 * @type {number}
 */
export const DEPTH_TEST = 0x0B71;


/**
 * @const
 * @type {number}
 */
export const SCISSOR_TEST = 0x0C11;


/**
 * @const
 * @type {number}
 */
export const UNSIGNED_BYTE = 0x1401;


/**
 * @const
 * @type {number}
 */
export const UNSIGNED_SHORT = 0x1403;


/**
 * @const
 * @type {number}
 */
export const UNSIGNED_INT = 0x1405;


/**
 * @const
 * @type {number}
 */
export const FLOAT = 0x1406;


/**
 * @const
 * @type {number}
 */
export const RGBA = 0x1908;


/**
 * @const
 * @type {number}
 */
export const FRAGMENT_SHADER = 0x8B30;


/**
 * @const
 * @type {number}
 */
export const VERTEX_SHADER = 0x8B31;


/**
 * @const
 * @type {number}
 */
export const LINK_STATUS = 0x8B82;


/**
 * @const
 * @type {number}
 */
export const LINEAR = 0x2601;


/**
 * @const
 * @type {number}
 */
export const TEXTURE_MAG_FILTER = 0x2800;


/**
 * @const
 * @type {number}
 */
export const TEXTURE_MIN_FILTER = 0x2801;


/**
 * @const
 * @type {number}
 */
export const TEXTURE_WRAP_S = 0x2802;


/**
 * @const
 * @type {number}
 */
export const TEXTURE_WRAP_T = 0x2803;


/**
 * @const
 * @type {number}
 */
export const TEXTURE_2D = 0x0DE1;


/**
 * @const
 * @type {number}
 */
export const TEXTURE0 = 0x84C0;


/**
 * @const
 * @type {number}
 */
export const CLAMP_TO_EDGE = 0x812F;


/**
 * @const
 * @type {number}
 */
export const COMPILE_STATUS = 0x8B81;


/**
 * @const
 * @type {number}
 */
export const FRAMEBUFFER = 0x8D40;


/** end of goog.webgl constants
 */


/**
 * @const
 * @type {Array<string>}
 */
const CONTEXT_IDS = [
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
export function getContext(canvas, opt_attributes) {
  const ii = CONTEXT_IDS.length;
  for (let i = 0; i < ii; ++i) {
    try {
      const context = canvas.getContext(CONTEXT_IDS[i], opt_attributes);
      if (context) {
        return /** @type {!WebGLRenderingContext} */ (context);
      }
    } catch (e) {
      // pass
    }
  }
  return null;
}


/**
 * Include debuggable shader sources.  Default is `true`. This should be set to
 * `false` for production builds.
 * @type {boolean}
 */
export const DEBUG = true;


/**
 * The maximum supported WebGL texture size in pixels. If WebGL is not
 * supported, the value is set to `undefined`.
 * @type {number|undefined}
 */
let MAX_TEXTURE_SIZE; // value is set below


/**
 * List of supported WebGL extensions.
 * @type {Array<string>}
 */
let EXTENSIONS; // value is set below


/**
 * True if both OpenLayers and browser support WebGL.
 * @type {boolean}
 * @api
 */
let HAS = false;

//TODO Remove side effects
if (typeof window !== 'undefined' && 'WebGLRenderingContext' in window) {
  try {
    const canvas = document.createElement('canvas');
    const gl = getContext(canvas);
    if (gl) {
      HAS = true;
      MAX_TEXTURE_SIZE = /** @type {number} */ (gl.getParameter(gl.MAX_TEXTURE_SIZE));
      EXTENSIONS = gl.getSupportedExtensions();
    }
  } catch (e) {
    // pass
  }
}

export {HAS, MAX_TEXTURE_SIZE, EXTENSIONS};
