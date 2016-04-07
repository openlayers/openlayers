/**
 * @fileoverview Definitions for externs that are either missing or incorrect
 * in the current release version of the closure compiler we use.
 *
 * The entries must be removed once they are available/correct in the
 * version we use.
 *
 * @externs
 */

// see https://github.com/google/closure-compiler/pull/1206

/**
 * @type {string}
 * @see http://www.w3.org/TR/pointerevents/#the-touch-action-css-property
 */
CSSProperties.prototype.touchAction;
