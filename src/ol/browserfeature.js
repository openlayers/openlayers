goog.provide('ol.BrowserFeature');


/**
 * @define {boolean} Assume touch.
 */
ol.ASSUME_TOUCH = false;


/**
* The ratio between physical pixels and device-independent pixels
* (dips) on the device (`window.devicePixelRatio`).
* @const
* @type {number}
* @todo stability experimental
*/
ol.BrowserFeature.DEVICE_PIXEL_RATIO = goog.global.devicePixelRatio || 1;


/**
* True if browser supports touch events.
* @const
* @type {boolean}
 * @todo stability experimental
*/
ol.BrowserFeature.HAS_TOUCH = ol.ASSUME_TOUCH ||
    (goog.global.document &&
    'ontouchstart' in goog.global.document.documentElement) ||
    !!(goog.global.navigator.msPointerEnabled);
