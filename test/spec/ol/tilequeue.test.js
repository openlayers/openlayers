goog.provide('ol.test.TileQueue');

describe('ol.TileQueue', function() {

  // is the tile queue's array a heap?
  function isHeap(tq) {
    var heap = tq.heap_;
    var i;
    var key;
    var leftKey;
    var rightKey;
    for (i = 0; i < (heap.length >> 1) - 1; i++) {
      key = heap[i][0];
      leftKey = heap[tq.getLeftChildIndex_(i)][0];
      rightKey = heap[tq.getRightChildIndex_(i)][0];
      if (leftKey < key || rightKey < key) {
        return false;
      }
    }
    return true;
  }

  function addRandomPriorityTiles(tq, num) {
    var i, tile, priority;
    for (i = 0; i < num; i++) {
      tile = new ol.Tile();
      priority = Math.floor(Math.random() * 100);
      tq.heap_.push([priority, tile, '', new ol.Coordinate(0, 0)]);
      tq.queuedTileKeys_[tile.getKey()] = true;
    }
  }

  describe('heapify', function() {
    it('does convert an arbitrary array into a heap', function() {

      var tq = new ol.TileQueue(function() {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();
      expect(isHeap(tq)).toBeTruthy();
    });
  });

  describe('reprioritize', function() {
    it('does reprioritize the array', function() {

      var tq = new ol.TileQueue(function() {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();

      // now reprioritize, changing the priority of 50 tiles and removing the
      // rest

      var i = 0;
      tq.tilePriorityFunction_ = function() {
        if ((i++) % 2 === 0) {
          return ol.TileQueue.DROP;
        }
        return Math.floor(Math.random() * 100);
      };

      tq.reprioritize();
      expect(tq.heap_.length).toEqual(50);
      expect(isHeap(tq)).toBeTruthy();

    });
  });
});

