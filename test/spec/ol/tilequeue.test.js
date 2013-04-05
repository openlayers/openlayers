goog.provide('ol.test.TileQueue');

describe('ol.TileQueue', function() {

  function addRandomPriorityTiles(tq, num) {
    var i, tile, priority;
    for (i = 0; i < num; i++) {
      tile = new ol.Tile();
      priority = Math.floor(Math.random() * 100);
      tq.elements_.push([tile, '', [0, 0]]);
      tq.priorities_.push(priority);
      tq.queuedElements_[tile.getKey()] = true;
    }
  }

  describe('heapify', function() {
    it('does convert an arbitrary array into a heap', function() {

      var tq = new ol.TileQueue(function() {});
      addRandomPriorityTiles(tq, 100);

      tq.heapify_();
      expect(function() {
        tq.assertValid();
      }).not.to.throwException();
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
      tq.priorityFunction_ = function() {
        if ((i++) % 2 === 0) {
          return ol.structs.PriorityQueue.DROP;
        }
        return Math.floor(Math.random() * 100);
      };

      tq.reprioritize();
      expect(tq.elements_.length).to.eql(50);
      expect(tq.priorities_.length).to.eql(50);
      expect(function() {
        tq.assertValid();
      }).not.to.throwException();

    });
  });
});

goog.require('ol.Tile');
goog.require('ol.TileQueue');
goog.require('ol.structs.PriorityQueue');
