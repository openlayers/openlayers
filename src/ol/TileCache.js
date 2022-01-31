/**
 * @module ol/TileCache
 */
import LRUCache from './structs/LRUCache.js';
import { fromKey, getKey } from './tilecoord.js';

class TileCache extends LRUCache {
  /**
   * @param {!Object<string, boolean>} usedTiles Used tiles.
   */
  expireCache(usedTiles) {
    while (this.canExpireCache()) {
      const tile = this.peekLast();
      if (tile.getKey() in usedTiles) {
        break;
      } else {
        this.pop().release();
      }
    }
  }

  /**
   * Prune all tiles from the cache that don't have the same z as the newest tile.
   */
  pruneExceptNewestZ() {
    if (this.getCount() === 0) {
      return;
    }
    const key = this.peekFirstKey();
    const tileCoord = fromKey(key);
    const z = tileCoord[0];
    this.forEach(
      function (tile) {
        if (tile.tileCoord[0] !== z) {
          this.remove(getKey(tile.tileCoord));
          tile.release();
        }
      }.bind(this)
    );
  }

  /**
  * Removes the canvas from all the TileCache and releases for each one leaving its canvas reduced to 1x1 to avoid overflow of canvas memory of IOS
  */
  releaseAllTileCacheCanvas() {
    if (this.getCount() === 0) {
      return;
    }
    this.forEach(function (tile) {
      this.remove(getKey(tile.tileCoord));
      tile.release();
    }.bind(this));
  };
}

export default TileCache;
