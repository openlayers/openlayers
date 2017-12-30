goog.provide('ol.coverage.CoverageType');

goog.require('ol');

if (ol.ENABLE_COVERAGE) {

  /**
   * Regular coverage type. It can be rectangular (raster), hexagonal, or a custom
   * space filling pattern.
   * @enum {string}
   */
  ol.coverage.CoverageType = {
    RECTANGULAR: 'rectangular',
    HEXAGONAL: 'hexagonal',
    CUSTOM: 'custom'
  };

}
