import _ol_ from './index';
import _ol_TileState_ from './tilestate';
import _ol_events_ from './events';
import _ol_events_EventType_ from './events/eventtype';
import _ol_structs_PriorityQueue_ from './structs/priorityqueue';

/**
 * @constructor
 * @extends {ol.structs.PriorityQueue.<Array>}
 * @param {ol.TilePriorityFunction} tilePriorityFunction
 *     Tile priority function.
 * @param {function(): ?} tileChangeCallback
 *     Function called on each tile change event.
 * @struct
 */
var _ol_TileQueue_ = function(tilePriorityFunction, tileChangeCallback) {

  _ol_structs_PriorityQueue_.call(
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

_ol_.inherits(_ol_TileQueue_, _ol_structs_PriorityQueue_);


/**
 * @inheritDoc
 */
_ol_TileQueue_.prototype.enqueue = function(element) {
  var added = _ol_structs_PriorityQueue_.prototype.enqueue.call(this, element);
  if (added) {
    var tile = element[0];
    _ol_events_.listen(tile, _ol_events_EventType_.CHANGE,
        this.handleTileChange, this);
  }
  return added;
};


/**
 * @return {number} Number of tiles loading.
 */
_ol_TileQueue_.prototype.getTilesLoading = function() {
  return this.tilesLoading_;
};


/**
 * @param {ol.events.Event} event Event.
 * @protected
 */
_ol_TileQueue_.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  var state = tile.getState();
  if (state === _ol_TileState_.LOADED || state === _ol_TileState_.ERROR ||
      state === _ol_TileState_.EMPTY || state === _ol_TileState_.ABORT) {
    _ol_events_.unlisten(tile, _ol_events_EventType_.CHANGE,
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
_ol_TileQueue_.prototype.loadMoreTiles = function(maxTotalLoading, maxNewLoads) {
  var newLoads = 0;
  var abortedTiles = false;
  var state, tile, tileKey;
  while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads &&
         this.getCount() > 0) {
    tile = /** @type {ol.Tile} */ (this.dequeue()[0]);
    tileKey = tile.getKey();
    state = tile.getState();
    if (state === _ol_TileState_.ABORT) {
      abortedTiles = true;
    } else if (state === _ol_TileState_.IDLE && !(tileKey in this.tilesLoadingKeys_)) {
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
export default _ol_TileQueue_;
