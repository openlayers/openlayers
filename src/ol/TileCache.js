/**
 * @module ol/TileCache
 */
import {inherits} from './util.js';
import LRUCache from './structs/LRUCache.js';
import {fromKey, getKey} from './tilecoord.js';

/**
 * @constructor
 * @extends {module:ol/structs/LRUCache.<module:ol/Tile>}
 * @param {number=} opt_highWaterMark High water mark.
 * @struct
 */
const TileCache = function(opt_highWaterMark) {

  LRUCache.call(this, opt_highWaterMark);

};

inherits(TileCache, LRUCache);


/**
 * @param {!Object.<string, module:ol/TileRange>} usedTiles Used tiles.
 */
TileCache.prototype.expireCache = function(usedTiles) {
  while (this.canExpireCache()) {
    const tile = this.peekLast();
    const zKey = tile.tileCoord[0].toString();
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
TileCache.prototype.pruneExceptNewestZ = function() {
  if (this.getCount() === 0) {
    return;
  }
  const key = this.peekFirstKey();
  const tileCoord = fromKey(key);
  const z = tileCoord[0];
  this.forEach(function(tile) {
    if (tile.tileCoord[0] !== z) {
      this.remove(getKey(tile.tileCoord));
      tile.dispose();
    }
  }, this);
};
export default TileCache;
