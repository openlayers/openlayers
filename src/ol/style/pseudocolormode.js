goog.provide('ol.style.PseudocolorMode');

goog.require('ol');

if (ol.ENABLE_COVERAGE) {

  /**
   * @enum {string}
   */
  ol.style.PseudocolorMode = {
    CATEGORIZED: 'categorized',
    INTERPOLATE: 'interpolate'
  };
}
