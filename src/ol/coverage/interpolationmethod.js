goog.provide('ol.coverage.InterpolationMethod');

goog.require('ol');

if (ol.ENABLE_COVERAGE) {

  /**
   * Coverage interpolation method. Currently only NN is supported.
   * @enum {string}
   */
  ol.coverage.InterpolationMethod = {
    NEAREST: 'nearest'
  };

}
