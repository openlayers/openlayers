/**
 * @module ol/TileCache
 */
import _ol_ from './index.js';
import _ol_structs_LRUCache_ from './structs/LRUCache.js';
import _ol_tilecoord_ from './tilecoord.js';

/**
 * @constructor
 * @extends {ol.structs.LRUCache.<ol.Tile>}
 * @param {number=} opt_highWaterMark High water mark.
 * @struct
 */
var _ol_TileCache_ = function(opt_highWaterMark) {

  _ol_structs_LRUCache_.call(this, opt_highWaterMark);

};

_ol_.inherits(_ol_TileCache_, _ol_structs_LRUCache_);


/**
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
_ol_TileCache_.prototype.expireCache = function(usedTiles) {
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
_ol_TileCache_.prototype.pruneExceptNewestZ = function() {
  if (this.getCount() === 0) {
    return;
  }
  var key = this.peekFirstKey();
  var tileCoord = _ol_tilecoord_.fromKey(key);
  var z = tileCoord[0];
  this.forEach(function(tile) {
    if (tile.tileCoord[0] !== z) {
      this.remove(_ol_tilecoord_.getKey(tile.tileCoord));
      tile.dispose();
    }
  }, this);
};
export default _ol_TileCache_;
