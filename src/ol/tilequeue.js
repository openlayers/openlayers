goog.provide('ol.TilePriorityFunction');
goog.provide('ol.TileQueue');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Coordinate');
goog.require('ol.Tile');
goog.require('ol.TileState');


/**
 * Tile Queue.
 *
 * The implementation is inspired from the Closure Library's Heap
 * class and Python's heapq module.
 *
 * http://closure-library.googlecode.com/svn/docs/closure_goog_structs_heap.js.source.html
 * http://hg.python.org/cpython/file/2.7/Lib/heapq.py
 */


/**
 * @typedef {function(ol.Tile, string, ol.Coordinate): number}
 */
ol.TilePriorityFunction;



/**
 * @constructor
 * @param {ol.TilePriorityFunction} tilePriorityFunction
 *     Tile priority function.
 * @param {Function} tileChangeCallback
 *     Function called on each tile change event.
 */
ol.TileQueue = function(tilePriorityFunction, tileChangeCallback) {

  /**
   * @private
   * @type {ol.TilePriorityFunction}
   */
  this.tilePriorityFunction_ = tilePriorityFunction;

  /**
   * @private
   * @type {Function}
   */
  this.tileChangeCallback_ = tileChangeCallback;

  /**
   * @private
   * @type {number}
   */
  this.maxTilesLoading_ = 8;

  /**
   * @private
   * @type {number}
   */
  this.tilesLoading_ = 0;

  /**
   * @private
   * @type {Array.<Array.<*>>}
   */
  this.heap_ = [];

  /**
   * @private
   * @type {Object.<string, boolean>}
   */
  this.queuedTileKeys_ = {};

};


/**
 * @const {number}
 */
ol.TileQueue.DROP = Infinity;


/**
 * Remove and return the highest-priority tile. O(logn).
 * @private
 * @return {ol.Tile} Tile.
 */
ol.TileQueue.prototype.dequeue_ = function() {
  var heap = this.heap_;
  goog.asserts.assert(heap.length > 0);
  var tile = /** @type {ol.Tile} */ (heap[0][1]);
  if (heap.length == 1) {
    heap.length = 0;
  } else {
    heap[0] = heap.pop();
    this.siftUp_(0);
  }
  var tileKey = tile.getKey();
  delete this.queuedTileKeys_[tileKey];
  return tile;
};


/**
 * Enqueue a tile. O(logn).
 * @param {ol.Tile} tile Tile.
 * @param {string} tileSourceKey Tile source key.
 * @param {ol.Coordinate} tileCenter Tile center.
 */
ol.TileQueue.prototype.enqueue = function(tile, tileSourceKey, tileCenter) {
  if (tile.getState() != ol.TileState.IDLE) {
    return;
  }
  var tileKey = tile.getKey();
  if (!(tileKey in this.queuedTileKeys_)) {
    var priority = this.tilePriorityFunction_(tile, tileSourceKey, tileCenter);
    if (priority != ol.TileQueue.DROP) {
      this.heap_.push([priority, tile, tileSourceKey, tileCenter]);
      this.queuedTileKeys_[tileKey] = true;
      this.siftDown_(0, this.heap_.length - 1);
    }
  }
};


/**
 * @protected
 */
ol.TileQueue.prototype.handleTileChange = function() {
  --this.tilesLoading_;
  this.tileChangeCallback_();
};


/**
 * Gets the index of the left child of the node at the given index.
 * @param {number} index The index of the node to get the left child for.
 * @return {number} The index of the left child.
 * @private
 */
ol.TileQueue.prototype.getLeftChildIndex_ = function(index) {
  return index * 2 + 1;
};


/**
 * Gets the index of the right child of the node at the given index.
 * @param {number} index The index of the node to get the right child for.
 * @return {number} The index of the right child.
 * @private
 */
ol.TileQueue.prototype.getRightChildIndex_ = function(index) {
  return index * 2 + 2;
};


/**
 * Gets the index of the parent of the node at the given index.
 * @param {number} index The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
ol.TileQueue.prototype.getParentIndex_ = function(index) {
  return (index - 1) >> 1;
};


/**
 * Make _heap a heap. O(n).
 * @private
 */
ol.TileQueue.prototype.heapify_ = function() {
  for (var i = (this.heap_.length >> 1) - 1; i >= 0; i--) {
    this.siftUp_(i);
  }
};


/**
 *  FIXME empty description for jsdoc
 */
ol.TileQueue.prototype.loadMoreTiles = function() {
  var tile;
  while (this.heap_.length > 0 && this.tilesLoading_ < this.maxTilesLoading_) {
    tile = /** @type {ol.Tile} */ (this.dequeue_());
    goog.events.listenOnce(tile, goog.events.EventType.CHANGE,
        this.handleTileChange, false, this);
    tile.load();
    ++this.tilesLoading_;
  }
};


/**
 * @param {number} index The index of the node to move down.
 * @private
 */
ol.TileQueue.prototype.siftUp_ = function(index) {
  var heap = this.heap_;
  var count = heap.length;
  var node = heap[index];
  var startIndex = index;

  while (index < (count >> 1)) {
    var lIndex = this.getLeftChildIndex_(index);
    var rIndex = this.getRightChildIndex_(index);

    var smallerChildIndex = rIndex < count &&
        heap[rIndex][0] < heap[lIndex][0] ?
        rIndex : lIndex;

    heap[index] = heap[smallerChildIndex];
    index = smallerChildIndex;
  }

  heap[index] = node;
  this.siftDown_(startIndex, index);
};


/**
 * @param {number} startIndex The index of the root.
 * @param {number} index The index of the node to move up.
 * @private
 */
ol.TileQueue.prototype.siftDown_ = function(startIndex, index) {
  var heap = this.heap_;
  var node = heap[index];

  while (index > startIndex) {
    var parentIndex = this.getParentIndex_(index);
    if (heap[parentIndex][0] > node[0]) {
      heap[index] = heap[parentIndex];
      index = parentIndex;
    } else {
      break;
    }
  }
  heap[index] = node;
};


/**
 * FIXME empty description for jsdoc
 */
ol.TileQueue.prototype.reprioritize = function() {
  var heap = this.heap_;
  var i, n = 0, node, priority, tile, tileCenter, tileKey, tileSourceKey;
  for (i = 0; i < heap.length; ++i) {
    node = heap[i];
    tile = /** @type {ol.Tile} */ (node[1]);
    tileSourceKey = /** @type {string} */ (node[2]);
    tileCenter = /** @type {ol.Coordinate} */ (node[3]);
    priority = this.tilePriorityFunction_(tile, tileSourceKey, tileCenter);
    if (priority == ol.TileQueue.DROP) {
      tileKey = tile.getKey();
      delete this.queuedTileKeys_[tileKey];
    } else {
      node[0] = priority;
      heap[n++] = node;
    }
  }
  heap.length = n;
  this.heapify_();
};
