/**
 * @module ol/index
 */

import webgl from './webgl.js';


/**
 * @type {string} Default WMS version.
 */
export var DEFAULT_WMS_VERSION = '1.3.0';


/**
 * @type {boolean} Include debuggable shader sources.  Default is `true`.
 *     This should be set to `false` for production builds.
 */
export var DEBUG_WEBGL = true;


/**
 * @type {string} OpenLayers version.
 */
export var VERSION = 'v4.6.4';


/**
 * The maximum supported WebGL texture size in pixels. If WebGL is not
 * supported, the value is set to `undefined`.
 * @const
 * @type {number|undefined}
 */
var WEBGL_MAX_TEXTURE_SIZE; // value is set below


/**
 * List of supported WebGL extensions.
 * @const
 * @type {Array.<string>}
 */
var WEBGL_EXTENSIONS; // value is set below


/**
 * WebGL is available.
 * @type {boolean}
 */
var HAS_WEBGL = false;


if ('WebGLRenderingContext' in window) {
  try {
    var canvas = /** @type {HTMLCanvasElement} */
        (document.createElement('CANVAS'));
    var gl = webgl.getContext(canvas, {failIfMajorPerformanceCaveat: true});
    if (gl) {
      HAS_WEBGL = true;
      WEBGL_MAX_TEXTURE_SIZE = /** @type {number} */
        (gl.getParameter(gl.MAX_TEXTURE_SIZE));
      WEBGL_EXTENSIONS = gl.getSupportedExtensions();
    }
  } catch (e) {
    // pass
  }
}

export {HAS_WEBGL, WEBGL_MAX_TEXTURE_SIZE, WEBGL_EXTENSIONS};


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
 * A reusable function, used e.g. as a default for callbacks.
 *
 * @return {undefined} Nothing.
 */
export function nullFunction() {}


/**
 * Counter for getUid.
 * @type {number}
 * @private
 */
var uidCounter_ = 0;

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


export default {
  getUid: getUid,
  nullFunction: nullFunction,
  inherits: inherits,
  VERSION: VERSION,
  DEFAULT_WMS_VERSION: DEFAULT_WMS_VERSION,
  DEBUG_WEBGL: DEBUG_WEBGL,
  HAS_WEBGL: HAS_WEBGL,
  WEBGL_MAX_TEXTURE_SIZE: WEBGL_MAX_TEXTURE_SIZE,
  WEBGL_EXTENSIONS: WEBGL_EXTENSIONS
};
