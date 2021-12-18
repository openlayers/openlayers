/**
 * @module ol/webgl
 */

import {assign} from './obj.js';

/**
 * Constants taken from goog.webgl
 */

/**
 * Used by {@link module:ol/webgl/Helper~WebGLHelper} for buffers containing vertices data, such as
 * position, color, texture coordinate, etc. These vertices are then referenced by an index buffer
 * to be drawn on screen (see {@link module:ol/webgl.ELEMENT_ARRAY_BUFFER}).
 * @const
 * @type {number}
 * @api
 */
export const ARRAY_BUFFER = 0x8892;

/**
 * Used by {@link module:ol/webgl/Helper~WebGLHelper} for buffers containing indices data.
 * Index buffers are essentially lists of references to vertices defined in a vertex buffer
 * (see {@link module:ol/webgl.ARRAY_BUFFER}), and define the primitives (triangles) to be drawn.
 * @const
 * @type {number}
 * @api
 */
export const ELEMENT_ARRAY_BUFFER = 0x8893;

/**
 * Used by {link module:ol/webgl/Buffer~WebGLArrayBuffer}.
 * @const
 * @type {number}
 * @api
 */
export const STREAM_DRAW = 0x88e0;

/**
 * Used by {link module:ol/webgl/Buffer~WebGLArrayBuffer}.
 * @const
 * @type {number}
 * @api
 */
export const STATIC_DRAW = 0x88e4;

/**
 * Used by {link module:ol/webgl/Buffer~WebGLArrayBuffer}.
 * @const
 * @type {number}
 * @api
 */
export const DYNAMIC_DRAW = 0x88e8;

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

/** end of goog.webgl constants
 */

/**
 * @const
 * @type {Array<string>}
 */
const CONTEXT_IDS = ['experimental-webgl', 'webgl', 'webkit-3d', 'moz-webgl'];

/**
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {Object} [opt_attributes] Attributes.
 * @return {WebGLRenderingContext} WebGL rendering context.
 */
export function getContext(canvas, opt_attributes) {
  const attributes = assign({preserveDrawingBuffer: true}, opt_attributes);
  const ii = CONTEXT_IDS.length;
  for (let i = 0; i < ii; ++i) {
    try {
      const context = canvas.getContext(CONTEXT_IDS[i], attributes);
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
 * @type {Array<string>}
 */
let supportedExtensions;

/**
 * @return {Array<string>} List of supported WebGL extensions.
 */
export function getSupportedExtensions() {
  if (!supportedExtensions) {
    const canvas = document.createElement('canvas');
    const gl = getContext(canvas);
    if (gl) {
      supportedExtensions = gl.getSupportedExtensions();
    }
  }
  return supportedExtensions;
}
