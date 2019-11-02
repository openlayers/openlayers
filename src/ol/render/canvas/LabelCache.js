import {getUid} from '../../util.js';
import LRUCache from '../../structs/LRUCache.js';

/**
 * @module ol/render/canvas/LabelCache
 */

/**
 * @classdesc
 * Cache of pre-rendered labels.
 */
class LabelCache extends LRUCache {

  /**
   * @inheritDoc
   */
  constructor(opt_highWaterMark) {
    super(opt_highWaterMark);
    this.consumers = {};
  }

  clear() {
    this.consumers = {};
    super.clear();
  }

  /**
   * @override
   * @param {string} key Label key.
   * @param {import("./Executor.js").default} consumer Label consumer.
   * @return {HTMLCanvasElement} Label.
   */
  get(key, consumer) {
    const canvas = super.get(key);
    const consumerId = getUid(consumer);
    if (!(consumerId in this.consumers)) {
      this.consumers[consumerId] = {};
    }
    this.consumers[consumerId][key] = true;
    return canvas;
  }

  prune() {
    outer:
    while (this.canExpireCache()) {
      const key = this.peekLastKey();
      for (const consumerId in this.consumers) {
        if (key in this.consumers[consumerId]) {
          break outer;
        }
      }
      const canvas = this.pop();
      canvas.width = 0;
      canvas.height = 0;
      for (const consumerId in this.consumers) {
        delete this.consumers[consumerId][key];
      }
    }
  }

  /**
   * @param {import("./Executor.js").default} consumer Label consumer.
   */
  release(consumer) {
    delete this.consumers[getUid(consumer)];
  }
}

export default LabelCache;
