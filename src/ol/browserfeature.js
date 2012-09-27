goog.provide('ol.BrowserFeature');


/**
 * @type {Object}
 */
ol.BrowserFeature = {
  // Do we have touch events?
  HAS_TOUCH: document && 'ontouchstart' in document.documentElement
};
