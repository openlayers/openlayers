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
   * True if browser supports touch events.
   * @type {boolean}
   */
  HAS_TOUCH: ol.ASSUME_TOUCH ||
      (document && 'ontouchstart' in document.documentElement) ||
      !!(window.navigator.msPointerEnabled)
};
