goog.provide('ol.TileCache');

goog.require('ol');
goog.require('ol.structs.LRUCache');


/**
 * @constructor
 * @extends {ol.structs.LRUCache.<ol.Tile>}
 * @param {number=} opt_highWaterMark High water mark.
 * @struct
 */
ol.TileCache = function(opt_highWaterMark) {

  ol.structs.LRUCache.call(this);

  /**
   * @private
   * @type {number}
   */
  this.highWaterMark_ = opt_highWaterMark !== undefined ? opt_highWaterMark : 2048;

};
ol.inherits(ol.TileCache, ol.structs.LRUCache);


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
    tile = this.peekLast();
    zKey = tile.tileCoord[0].toString();
    if (zKey in usedTiles && usedTiles[zKey].contains(tile.tileCoord)) {
      break;
    } else {
      this.pop().dispose();
    }
  }
};
