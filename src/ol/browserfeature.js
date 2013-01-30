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
   * @type {boolean} True if browser supports touch events
   */
  HAS_TOUCH: ol.ASSUME_TOUCH ||
      (document && 'ontouchstart' in document.documentElement) ||
      !!(window.navigator.msPointerEnabled)
};
