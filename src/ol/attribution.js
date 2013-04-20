goog.provide('ol.Attribution');

goog.require('ol.TileRange');



/**
 * @constructor
 * @param {string} html HTML.
 * @param {Object.<string, Array.<ol.TileRange>>=} opt_tileRanges Tile ranges.
 */
ol.Attribution = function(html, opt_tileRanges) {

  /**
   * @private
   * @type {string}
   */
  this.html_ = html;

  /**
   * @private
   * @type {Object.<string, Array.<ol.TileRange>>}
   */
  this.tileRanges_ = opt_tileRanges || null;

};


/**
 * @return {string} HTML.
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
