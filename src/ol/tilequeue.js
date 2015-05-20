goog.provide('ol.TilePriorityFunction');
goog.provide('ol.TileQueue');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Coordinate');
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

};
goog.inherits(ol.TileQueue, ol.structs.PriorityQueue);


/**
 * @return {number} Number of tiles loading.
 */
ol.TileQueue.prototype.getTilesLoading = function() {
  return this.tilesLoading_;
};


/**
 * @protected
 */
ol.TileQueue.prototype.handleTileChange = function() {
  --this.tilesLoading_;
  this.tileChangeCallback_();
};


/**
 * @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
 * @param {number} maxNewLoads Maximum number of new tiles to load.
 */
ol.TileQueue.prototype.loadMoreTiles = function(maxTotalLoading, maxNewLoads) {
  var newLoads = Math.min(
      maxTotalLoading - this.getTilesLoading(), maxNewLoads, this.getCount());
  var i, tile;
  for (i = 0; i < newLoads; ++i) {
    tile = /** @type {ol.Tile} */ (this.dequeue()[0]);
    goog.events.listenOnce(tile, goog.events.EventType.CHANGE,
        this.handleTileChange, false, this);
    tile.load();
  }
  this.tilesLoading_ += newLoads;
};
