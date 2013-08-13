/**
 * @fileoverview Definitions for extensions over the W3C's DOM3 specification
 * in HTML5 which are not yet available with the current release version of
 * the closure compiler we use.
 * @see http://dev.w3.org/html5/spec/Overview.html
 * @externs
 */

// See issue https://code.google.com/p/closure-compiler/issues/detail?id=1060
// FIXME: this should be remove when the next closure compiler release is out
//        with valueAsDate and valueAsNumber externs.

/** @type {Date} */
HTMLInputElement.prototype.valueAsDate;

/** @type {number} */
HTMLInputElement.prototype.valueAsNumber;
