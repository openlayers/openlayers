goog.provide('ol.test.TileQueue');

goog.require('ol.ImageTile');
goog.require('ol.Tile');
goog.require('ol.TileQueue');
goog.require('ol.source.Image');
goog.require('ol.structs.PriorityQueue');


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

  var tileId = 0;
  function createImageTile(opt_tileLoadFunction) {
    ++tileId;
    var tileCoord = [tileId, tileId, tileId];
    var state = 0; // IDLE
    var src = 'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAP///' +
        'yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==#' + tileId;

    var tileLoadFunction = opt_tileLoadFunction ?
        opt_tileLoadFunction : ol.source.Image.defaultImageLoadFunction;
    return new ol.ImageTile(tileCoord, state, src, null, tileLoadFunction);
  }

  describe('#loadMoreTiles()', function() {
    var noop = function() {};

    it('works when tile queues share tiles', function(done) {
      var q1 = new ol.TileQueue(noop, noop);
      var q2 = new ol.TileQueue(noop, noop);

      var numTiles = 20;
      for (var i = 0; i < numTiles; ++i) {
        var tile = createImageTile();
        q1.enqueue([tile]);
        q2.enqueue([tile]);
      }

      // Initially, both have all tiles.
      expect(q1.getCount()).to.equal(numTiles);
      expect(q2.getCount()).to.equal(numTiles);

      var maxLoading = numTiles / 2;

      // and nothing is loading
      expect(q1.getTilesLoading()).to.equal(0);
      expect(q2.getTilesLoading()).to.equal(0);

      // ask both to load
      q1.loadMoreTiles(maxLoading, maxLoading);
      q2.loadMoreTiles(maxLoading, maxLoading);

      // both tiles will be loading the max
      expect(q1.getTilesLoading()).to.equal(maxLoading);
      expect(q2.getTilesLoading()).to.equal(maxLoading);

      // the second queue will be empty now
      expect(q1.getCount()).to.equal(numTiles - maxLoading);
      expect(q2.getCount()).to.equal(0);

      // let all tiles load
      setTimeout(function() {
        expect(q1.getTilesLoading()).to.equal(0);
        expect(q2.getTilesLoading()).to.equal(0);

        // ask both to load, this should clear q1
        q1.loadMoreTiles(maxLoading, maxLoading);
        q2.loadMoreTiles(maxLoading, maxLoading);

        expect(q1.getCount()).to.equal(0);
        expect(q2.getCount()).to.equal(0);

        done();
      }, 20);

    });

  });

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

  describe('tile change event', function() {
    var noop = function() {};

    it('abort queued tiles', function() {
      var tq = new ol.TileQueue(noop, noop);
      var tile = createImageTile();
      expect(tile.hasListener('change')).to.be(false);

      tq.enqueue([tile]);
      expect(tile.hasListener('change')).to.be(true);

      tile.dispose();
      expect(tile.hasListener('change')).to.be(false);
      expect(tile.getState()).to.eql(5); // ABORT
    });

    it('abort loading tiles', function() {
      var tq = new ol.TileQueue(noop, noop);
      var tile = createImageTile(noop);

      tq.enqueue([tile]);
      tq.loadMoreTiles(Infinity, Infinity);
      expect(tq.getTilesLoading()).to.eql(1);
      expect(tile.getState()).to.eql(1); // LOADING

      tile.dispose();
      expect(tq.getTilesLoading()).to.eql(0);
      expect(tile.hasListener('change')).to.be(false);
      expect(tile.getState()).to.eql(5); // ABORT

    });

  });

});
