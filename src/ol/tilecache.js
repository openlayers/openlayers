goog.provide('ol.TileCache');

goog.require('ol.Tile');
goog.require('ol.TileRange');
goog.require('ol.structs.LinkedMap');


/**
 * @define {number} Default high water mark.
 */
ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK = 512;



/**
 * @constructor
 * @extends {ol.structs.LinkedMap}
 * @param {number=} opt_highWaterMark High water mark.
 */
ol.TileCache = function(opt_highWaterMark) {

  goog.base(this, undefined, true);

  /**
   * @private
   * @type {number}
   */
  this.highWaterMark_ = goog.isDef(opt_highWaterMark) ?
      opt_highWaterMark : ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK;

};
goog.inherits(ol.TileCache, ol.structs.LinkedMap);


/**
 * @return {boolean} Can expire cache.
 */
ol.TileCache.prototype.canExpireCache = function() {
  return this.getCount() > this.highWaterMark_;
};


/**
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
ol.TileCache.prototype.expireCache = function(usedTiles) {
  var tile, zKey;
  while (this.canExpireCache()) {
    tile = /** @type {ol.Tile} */ (this.peekLast());
    zKey = tile.tileCoord.z.toString();
    if (zKey in usedTiles && usedTiles[zKey].contains(tile.tileCoord)) {
      break;
    } else {
      this.pop();
    }
  }
};
