goog.provide('ol.coverage.util');


/**
 * Convenience function for resampling and translating input raster bands.
 * @param {Array.<ol.coverage.Band>} bands Bands.
 * @return {{matrices: Array.<Array.<number>|ol.TypedArray>,
             extent: ol.Extent,
             stride: number,
             resolution: ol.Size}} Aligned matrices with common properties.
 */
ol.coverage.util.alignRasterBands = function(bands) {
  var rasters = {matrices: [],
    extent: bands[0].getExtent(),
    stride: bands[0].getStride(),
    resolution: bands[0].getResolution()};
  var i, ii;
  for (i = 0, ii = bands.length; i < ii; ++i) {
    rasters.matrices.push(bands[i].getCoverageData());
    //TBD
  }
  return rasters;
};
