goog.provide('ol.TileCache');

goog.require('ol');
goog.require('ol.structs.LRUCache');
goog.require('ol.tilecoord');


/**
 * @constructor
 * @extends {ol.structs.LRUCache.<ol.Tile>}
 * @param {number=} opt_highWaterMark High water mark.
 * @struct
 */
ol.TileCache = function(opt_highWaterMark) {

  ol.structs.LRUCache.call(this, opt_highWaterMark);

};
ol.inherits(ol.TileCache, ol.structs.LRUCache);


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


/**
 * Prune all tiles from the cache that don't have the same z as the newest tile.
 */
ol.TileCache.prototype.pruneExceptNewestZ = function() {
  if (this.getCount() === 0) {
    return;
  }
  var key = this.peekFirstKey();
  var tileCoord = ol.tilecoord.fromKey(key);
  var z = tileCoord[0];
  this.forEach(function(tile) {
    if (tile.tileCoord[0] !== z) {
      this.remove(ol.tilecoord.getKey(tile.tileCoord));
      tile.dispose();
    }
  }, this);
};
