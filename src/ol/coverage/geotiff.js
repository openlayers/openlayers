goog.provide('ol.coverage.geotiff');

goog.require('ol');


if (ol.ENABLE_COVERAGE) {

  /**
   * @private
   * @type {GeoTIFF}
   */
  ol.coverage.geotiff.cache_ = null;


  /**
   * Store the GeoTIFF function.
   * @param {GeoTIFF} geotiff The GeoTIFF function.
   */
  ol.coverage.geotiff.set = function(geotiff) {
    ol.coverage.geotiff.cache_ = geotiff;
  };


  /**
   * Get the GeoTIFF lib.
   * @return {GeoTIFF} The GeoTIFF function set above or available globally.
   */
  ol.coverage.geotiff.get = function() {
    return ol.coverage.geotiff.cache_ || window['GeoTIFF'];
  };

}
