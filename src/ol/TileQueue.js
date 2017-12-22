/**
 * @module ol/TileQueue
 */
import {inherits} from './index.js';
import TileState from './TileState.js';
import _ol_events_ from './events.js';
import EventType from './events/EventType.js';
import PriorityQueue from './structs/PriorityQueue.js';

/**
 * @constructor
 * @extends {ol.structs.PriorityQueue.<Array>}
 * @param {ol.TilePriorityFunction} tilePriorityFunction
 *     Tile priority function.
 * @param {function(): ?} tileChangeCallback
 *     Function called on each tile change event.
 * @struct
 */
var TileQueue = function(tilePriorityFunction, tileChangeCallback) {

  PriorityQueue.call(
      this,
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
        return /** @type {ol.Tile} */ (element[0]).getKey();
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
   * @type {!Object.<string,boolean>}
   */
  this.tilesLoadingKeys_ = {};

};

inherits(TileQueue, PriorityQueue);


/**
 * @inheritDoc
 */
TileQueue.prototype.enqueue = function(element) {
  var added = PriorityQueue.prototype.enqueue.call(this, element);
  if (added) {
    var tile = element[0];
    _ol_events_.listen(tile, EventType.CHANGE,
        this.handleTileChange, this);
  }
  return added;
};


/**
 * @return {number} Number of tiles loading.
 */
TileQueue.prototype.getTilesLoading = function() {
  return this.tilesLoading_;
};


/**
 * @param {ol.events.Event} event Event.
 * @protected
 */
TileQueue.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  var state = tile.getState();
  if (state === TileState.LOADED || state === TileState.ERROR ||
      state === TileState.EMPTY || state === TileState.ABORT) {
    _ol_events_.unlisten(tile, EventType.CHANGE,
        this.handleTileChange, this);
    var tileKey = tile.getKey();
    if (tileKey in this.tilesLoadingKeys_) {
      delete this.tilesLoadingKeys_[tileKey];
      --this.tilesLoading_;
    }
    this.tileChangeCallback_();
  }
};


/**
 * @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
 * @param {number} maxNewLoads Maximum number of new tiles to load.
 */
TileQueue.prototype.loadMoreTiles = function(maxTotalLoading, maxNewLoads) {
  var newLoads = 0;
  var abortedTiles = false;
  var state, tile, tileKey;
  while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads &&
         this.getCount() > 0) {
    tile = /** @type {ol.Tile} */ (this.dequeue()[0]);
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
};
export default TileQueue;
