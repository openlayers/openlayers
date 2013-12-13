goog.provide('ol.TileCache');

goog.require('goog.asserts');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.structs.LRUCache');


/**
 * @define {number} Default high water mark.
 */
ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK = 2048;



/**
 * @constructor
 * @extends {ol.structs.LRUCache.<ol.Tile>}
 * @param {number=} opt_highWaterMark High water mark.
 * @struct
 */
ol.TileCache = function(opt_highWaterMark) {

  goog.base(this);

  /**
   * @private
   * @type {number}
   */
  this.highWaterMark_ = goog.isDef(opt_highWaterMark) ?
      opt_highWaterMark : ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK;

};
goog.inherits(ol.TileCache, ol.structs.LRUCache);


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


/**
 * Remove a tile range from the cache, e.g. to invalidate tiles.
 * @param {ol.TileRange} tileRange The tile range to prune.
 */
ol.TileCache.prototype.pruneTileRange = function(tileRange) {
  var i = this.getCount(),
      key;
  while (i--) {
    key = this.peekLastKey();
    if (tileRange.contains(ol.TileCoord.createFromString(key))) {
      this.pop();
    } else {
      this.get(key);
    }
  }
};
