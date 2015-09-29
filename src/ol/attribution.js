goog.provide('ol.Attribution');

goog.require('goog.math');
goog.require('ol.TileRange');



/**
 * @classdesc
 * An attribution for a layer source.
 *
 * Example:
 *
 *     source: new ol.source.OSM({
 *       attributions: [
 *         new ol.Attribution({
 *           html: 'All maps &copy; ' +
 *               '<a href="http://www.opencyclemap.org/">OpenCycleMap</a>'
 *         }),
 *         ol.source.OSM.ATTRIBUTION
 *       ],
 *     ..
 *
 * @constructor
 * @param {olx.AttributionOptions} options Attribution options.
 * @struct
 * @api stable
 */
ol.Attribution = function(options) {

  /**
   * @private
   * @type {string}
   */
  this.html_ = options.html;

  /**
   * @private
   * @type {Object.<string, Array.<ol.TileRange>>}
   */
  this.tileRanges_ = options.tileRanges ? options.tileRanges : null;

};


/**
 * Get the attribution markup.
 * @return {string} The attribution HTML.
 * @api stable
 */
ol.Attribution.prototype.getHTML = function() {
  return this.html_;
};


/**
 * @param {Object.<string, ol.TileRange>} tileRanges Tile ranges.
 * @param {!ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @param {!ol.proj.Projection} projection Projection.
 * @return {boolean} Intersects any tile range.
 */
ol.Attribution.prototype.intersectsAnyTileRange =
    function(tileRanges, tileGrid, projection) {
  if (!this.tileRanges_) {
    return true;
  }
  var i, ii, tileRange, zKey;
  for (zKey in tileRanges) {
    if (!(zKey in this.tileRanges_)) {
      continue;
    }
    tileRange = tileRanges[zKey];
    var testTileRange;
    for (i = 0, ii = this.tileRanges_[zKey].length; i < ii; ++i) {
      testTileRange = this.tileRanges_[zKey][i];
      if (testTileRange.intersects(tileRange)) {
        return true;
      }
      var extentTileRange = tileGrid.getTileRangeForExtentAndZ(
          projection.getExtent(), parseInt(zKey, 10));
      var width = extentTileRange.getWidth();
      if (tileRange.minX < extentTileRange.minX ||
          tileRange.maxX > extentTileRange.maxX) {
        if (testTileRange.intersects(new ol.TileRange(
            goog.math.modulo(tileRange.minX, width),
            goog.math.modulo(tileRange.maxX, width),
            tileRange.minY, tileRange.maxY))) {
          return true;
        }
        if (tileRange.getWidth() > width &&
            testTileRange.intersects(extentTileRange)) {
          return true;
        }
      }
    }
  }
  return false;
};
