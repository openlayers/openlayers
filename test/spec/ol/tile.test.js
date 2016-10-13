goog.provide('ol.test.Tile');

goog.require('ol.Tile');

describe('ol.Tile', function() {
  describe('interimChain', function() {
    var head, renderTile;
    beforeEach(function() {
      var tileCoord = [0, 0, 0];
      head = new ol.ImageTile(tileCoord, ol.Tile.State.IDLE);
      ol.getUid(head);

      var addToChain = function(tile, state) {
        var next = new ol.ImageTile(tileCoord, state);
        ol.getUid(next);
        tile.interimTile = next;
        return next;
      };
      var tail = addToChain(head,ol.Tile.State.IDLE); //discard, deprecated by head
      tail = addToChain(tail,ol.Tile.State.LOADING); //keep, request already going
      tail = addToChain(tail,ol.Tile.State.IDLE); //discard, deprecated by head
      tail = addToChain(tail,ol.Tile.State.LOADED); //keep, use for rendering
      renderTile = tail; //store this tile for later tests
      tail = addToChain(tail,ol.Tile.State.IDLE);  //rest of list outdated by tile above
      tail = addToChain(tail,ol.Tile.State.LOADED);
      tail = addToChain(tail,ol.Tile.State.LOADING);
      tail = addToChain(tail,ol.Tile.State.LOADED);

    });

    it('shrinks tile chain correctly', function(done) {
      var chainLength = function(tile) {
        var c = 0;
        while (tile) {
          ++c;
          tile = tile.interimTile;
        }
        return c;
      };

      expect(chainLength(head)).to.be(9);
      head.refreshInterimChain();
      expect(chainLength(head)).to.be(3);
      done();
    });

    it('gives the right tile to render', function(done) {
      expect(head.getInterimTile()).to.be(renderTile);
      head.refreshInterimChain();
      expect(head.getInterimTile()).to.be(renderTile);
      done();
    });

    it('discards everything after the render tile', function(done) {
      head.refreshInterimChain();
      expect(renderTile.interimTile).to.be(null);
      done();
    });

    it('preserves order of tiles', function(done) {
      head.refreshInterimChain();
      while (head.interimTile !== null) {
        //use property of ol.getUid returning increasing id's.
        expect(ol.getUid(head) < ol.getUid(head.interimTile));
        head = head.interimTile;
      }
      done();
    });
  });

});
