/**
 * @module ol
 */

import {getContext} from './webgl.js';


/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 * @typedef {Array.<number>} Pixel
 * @api
 */


/**
 * Include debuggable shader sources.  Default is `true`. This should be set to
 * `false` for production builds.
 * TODO: move to a separate ol-webgl package
 * @type {boolean}
 */
export const DEBUG_WEBGL = true;


/**
 * TODO: move to a separate ol-webgl package
 * The maximum supported WebGL texture size in pixels. If WebGL is not
 * supported, the value is set to `undefined`.
 * @type {number|undefined}
 */
let WEBGL_MAX_TEXTURE_SIZE; // value is set below


/**
 * TODO: move to a separate ol-webgl package
 * List of supported WebGL extensions.
 * @type {Array.<string>}
 */
let WEBGL_EXTENSIONS; // value is set below


/**
 * TODO: move to a separate ol-webgl package
 * WebGL is available.
 * @type {boolean}
 */
let HAS_WEBGL = false;


if (typeof window !== 'undefined' && 'WebGLRenderingContext' in window) {
  try {
    const canvas = /** @type {HTMLCanvasElement} */ (document.createElement('CANVAS'));
    const gl = getContext(canvas, {failIfMajorPerformanceCaveat: true});
    if (gl) {
      HAS_WEBGL = true;
      WEBGL_MAX_TEXTURE_SIZE = /** @type {number} */ (gl.getParameter(gl.MAX_TEXTURE_SIZE));
      WEBGL_EXTENSIONS = gl.getSupportedExtensions();
    }
  } catch (e) {
    // pass
  }
}

export {HAS_WEBGL, WEBGL_MAX_TEXTURE_SIZE, WEBGL_EXTENSIONS};


/**
 * OpenLayers version.
 * @type {string}
 */
export const VERSION = 'v4.6.4';


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 *
 *     function ParentClass(a, b) { }
 *     ParentClass.prototype.foo = function(a) { }
 *
 *     function ChildClass(a, b, c) {
 *       // Call parent constructor
 *       ParentClass.call(this, a, b);
 *     }
 *     inherits(ChildClass, ParentClass);
 *
 *     var child = new ChildClass('a', 'b', 'see');
 *     child.foo(); // This works.
 *
 * @param {!Function} childCtor Child constructor.
 * @param {!Function} parentCtor Parent constructor.
 * @function
 * @api
 */
export function inherits(childCtor, parentCtor) {
  childCtor.prototype = Object.create(parentCtor.prototype);
  childCtor.prototype.constructor = childCtor;
}


/**
 * Counter for getUid.
 * @type {number}
 * @private
 */
let uidCounter_ = 0;

/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. Unique IDs are generated
 * as a strictly increasing sequence. Adapted from goog.getUid.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
export function getUid(obj) {
  return obj.ol_uid || (obj.ol_uid = ++uidCounter_);
}
