goog.provide('ol.TilePriorityFunction');
goog.provide('ol.TileQueue');

goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.Coordinate');
goog.require('ol.TileState');
goog.require('ol.structs.PriorityQueue');


/**
 * @typedef {function(ol.Tile, string, ol.Coordinate, number): number}
 */
ol.TilePriorityFunction;


/**
 * @constructor
 * @extends {ol.structs.PriorityQueue.<Array>}
 * @param {ol.TilePriorityFunction} tilePriorityFunction
 *     Tile priority function.
 * @param {function(): ?} tileChangeCallback
 *     Function called on each tile change event.
 * @struct
 */
ol.TileQueue = function(tilePriorityFunction, tileChangeCallback) {

  goog.base(
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
   * @type {Object.<string,boolean>}
   */
  this.tilesLoadingKeys_ = {};

};
goog.inherits(ol.TileQueue, ol.structs.PriorityQueue);


/**
 * @inheritDoc
 */
ol.TileQueue.prototype.enqueue = function(element) {
  var added = goog.base(this, 'enqueue', element);
  if (added) {
    var tile = element[0];
    ol.events.listen(tile, ol.events.EventType.CHANGE,
        this.handleTileChange, false, this);
  }
  return added;
};


/**
 * @return {number} Number of tiles loading.
 */
ol.TileQueue.prototype.getTilesLoading = function() {
  return this.tilesLoading_;
};


/**
 * @param {ol.events.Event} event Event.
 * @protected
 */
ol.TileQueue.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  var state = tile.getState();
  if (state === ol.TileState.LOADED || state === ol.TileState.ERROR ||
      state === ol.TileState.EMPTY) {
    ol.events.unlisten(tile, ol.events.EventType.CHANGE,
        this.handleTileChange, false, this);
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
ol.TileQueue.prototype.loadMoreTiles = function(maxTotalLoading, maxNewLoads) {
  var newLoads = 0;
  var tile;
  while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads &&
         this.getCount() > 0) {
    tile = /** @type {ol.Tile} */ (this.dequeue()[0]);
    if (tile.getState() === ol.TileState.IDLE) {
      this.tilesLoadingKeys_[tile.getKey()] = true;
      ++this.tilesLoading_;
      ++newLoads;
      tile.load();
    }
  }
};
