/**
 * @module ol/TileQueue
 */
import TileState from './TileState.js';
import {listen, unlisten} from './events.js';
import EventType from './events/EventType.js';
import PriorityQueue from './structs/PriorityQueue.js';


/**
 * @typedef {function(import("./Tile.js").default, string, import("./coordinate.js").Coordinate, number): number} PriorityFunction
 */


class TileQueue extends PriorityQueue {

  /**
   * @param {PriorityFunction} tilePriorityFunction Tile priority function.
   * @param {function(): ?} tileChangeCallback Function called on each tile change event.
   */
  constructor(tilePriorityFunction, tileChangeCallback) {

    super(
      /**
       * @param {Array} element Element.
       * @return {number} Priority.
       */
      function(element) {
        return tilePriorityFunction.apply(null, element);
      },
      /**
       * @param {Array} element Element.
       * @return {string} Key.
       */
      function(element) {
        return (/** @type {import("./Tile.js").default} */ (element[0]).getKey());
      });

    /**
     * @private
     * @type {function(): ?}
     */
    this.tileChangeCallback_ = tileChangeCallback;

    /**
     * @private
     * @type {number}
     */
    this.tilesLoading_ = 0;

    /**
     * @private
     * @type {!Object<string,boolean>}
     */
    this.tilesLoadingKeys_ = {};

  }

  /**
   * @inheritDoc
   */
  enqueue(element) {
    const added = super.enqueue(element);
    if (added) {
      const tile = element[0];
      listen(tile, EventType.CHANGE, this.handleTileChange, this);
    }
    return added;
  }

  /**
   * @return {number} Number of tiles loading.
   */
  getTilesLoading() {
    return this.tilesLoading_;
  }

  /**
   * @param {import("./events/Event.js").default} event Event.
   * @protected
   */
  handleTileChange(event) {
    const tile = /** @type {import("./Tile.js").default} */ (event.target);
    const state = tile.getState();
    if (tile.hifi && state === TileState.LOADED || state === TileState.ERROR ||
        state === TileState.EMPTY || state === TileState.ABORT) {
      unlisten(tile, EventType.CHANGE, this.handleTileChange, this);
      const tileKey = tile.getKey();
      if (tileKey in this.tilesLoadingKeys_) {
        delete this.tilesLoadingKeys_[tileKey];
        --this.tilesLoading_;
      }
      this.tileChangeCallback_();
    }
  }

  /**
   * @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
   * @param {number} maxNewLoads Maximum number of new tiles to load.
   */
  loadMoreTiles(maxTotalLoading, maxNewLoads) {
    let newLoads = 0;
    let abortedTiles = false;
    let state, tile, tileKey;
    while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads &&
           this.getCount() > 0) {
      tile = /** @type {import("./Tile.js").default} */ (this.dequeue()[0]);
      tileKey = tile.getKey();
      state = tile.getState();
      if (state === TileState.ABORT) {
        abortedTiles = true;
      } else if (state === TileState.IDLE && !(tileKey in this.tilesLoadingKeys_)) {
        this.tilesLoadingKeys_[tileKey] = true;
        ++this.tilesLoading_;
        ++newLoads;
        tile.load();
      }
    }
    if (newLoads === 0 && abortedTiles) {
      // Do not stop the render loop when all wanted tiles were aborted due to
      // a small, saturated tile cache.
      this.tileChangeCallback_();
    }
  }
}


export default TileQueue;
