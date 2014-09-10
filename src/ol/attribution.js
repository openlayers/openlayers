goog.provide('ol.Attribution');

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
 *         ol.source.OSM.DATA_ATTRIBUTION
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
  this.tileRanges_ = goog.isDef(options.tileRanges) ?
      options.tileRanges : null;

};


/**
 * @return {string} HTML.
 * @api stable
 */
ol.Attribution.prototype.getHTML = function() {
  return this.html_;
};


/**
 * @param {Object.<string, ol.TileRange>} tileRanges Tile ranges.
 * @return {boolean} Intersects any tile range.
 */
ol.Attribution.prototype.intersectsAnyTileRange = function(tileRanges) {
  if (goog.isNull(this.tileRanges_)) {
    return true;
  }
  var i, ii, tileRange, z;
  for (z in tileRanges) {
    if (!(z in this.tileRanges_)) {
      continue;
    }
    tileRange = tileRanges[z];
    for (i = 0, ii = this.tileRanges_[z].length; i < ii; ++i) {
      if (this.tileRanges_[z][i].intersects(tileRange)) {
        return true;
      }
    }
  }
  return false;
};
