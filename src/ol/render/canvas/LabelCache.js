import LRUCache from '../../structs/LRUCache.js';

/**
 * @module ol/render/canvas/LabelCache
 */

/**
 * @classdesc
 * Cache of pre-rendered labels.
 */
class LabelCache extends LRUCache {

  expireCache() {
    while (this.canExpireCache()) {
      this.pop();
    }
  }
}

export default LabelCache;
