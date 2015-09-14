/**
 * @fileoverview Definitions for externs that are either missing or incorrect
 * in the current release version of the closure compiler we use.
 *
 * The entries must be removed once they are available/correct in the
 * version we use.
 *
 * @externs
 */

/** @type {number} */
Touch.prototype.force;


/** @type {number} */
Touch.prototype.radiusX;


/** @type {number} */
Touch.prototype.radiusY;


/** @type {number} */
Touch.prototype.webkitForce;


/** @type {number} */
Touch.prototype.webkitRadiusX;


/** @type {number} */
Touch.prototype.webkitRadiusY;


// see https://github.com/google/closure-compiler/pull/1139

/**
 * @type {string}
 * @see http://www.w3.org/TR/pointerevents/#the-touch-action-css-property
 */
CSSProperties.prototype.touchAction;
