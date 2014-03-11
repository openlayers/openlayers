/**
 * @fileoverview Definitions for externs that are either missing or incorrect
 * in the current release version of the closure compiler we use.
 *
 * The entries must be removed once they are available/correct in the
 * version we use.
 *
 * @externs
 */

// @see https://code.google.com/p/closure-compiler/issues/detail?id=1060

/** @type {Date} */
HTMLInputElement.prototype.valueAsDate;

/** @type {number} */
HTMLInputElement.prototype.valueAsNumber;


// @see https://code.google.com/p/closure-compiler/issues/detail?id=1084

/** @type {?number} */
DeviceRotationRate.prototype.alpha;

/** @type {?number} */
DeviceRotationRate.prototype.beta;

/** @type {?number} */
DeviceRotationRate.prototype.gamma;


// @see https://code.google.com/p/closure-compiler/issues/detail?id=1088

/** @type {?number} */
DeviceOrientationEvent.prototype.webkitCompassAccuracy;

/** @type {?number} */
DeviceOrientationEvent.prototype.webkitCompassHeading;


// IE 11 fullscreen API
// http://msdn.microsoft.com/en-us/library/ie/dn265028(v=vs.85).aspx

/** @return {void} */
Element.prototype.msRequestFullscreen = function() {};

/** @return {void} */
Element.prototype.msExitFullscreen = function() {};

/** @type {boolean} */
Document.prototype.msFullscreenEnabled;

/** @type {Element} */
Document.prototype.msFullscreenElement;
