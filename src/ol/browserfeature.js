goog.provide('ol.BrowserFeature');


/**
 * @define {boolean} Assume touch.
 */
ol.ASSUME_TOUCH = false;


/**
 * @type {Object}
 */
ol.BrowserFeature = {
  /**
   * The ratio between physical pixels and device-independent pixels
   * (dips) on the device (`window.devicePixelRatio`).
   * @type {number}
   */
  DEVICE_PIXEL_RATIO: goog.global.devicePixelRatio || 1,

  /**
   * True if browser supports touch events.
   * @type {boolean}
   */
  HAS_TOUCH: ol.ASSUME_TOUCH ||
      (goog.global.document &&
      'ontouchstart' in goog.global.document.documentElement) ||
      !!(goog.global.navigator.msPointerEnabled)
};
