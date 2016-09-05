/**
 * @fileoverview Definitions for externs that are either missing or incorrect
 * in the current release version of the closure compiler we use.
 *
 * The entries must be removed once they are available/correct in the
 * version we use.
 *
 * @externs
 */


// see https://github.com/google/closure-compiler/pull/1991

/**
 * @param {*} arg
 * @return {boolean}
 * @nosideeffects
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/isView
 */
ArrayBuffer.isView = function(arg) {};


// see https://github.com/google/closure-compiler/pull/1206

/**
 * @type {string}
 * @see http://www.w3.org/TR/pointerevents/#the-touch-action-css-property
 */
CSSProperties.prototype.touchAction;
