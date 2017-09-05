

import _ol_ from '../../../src/ol';
import _ol_ImageTile_ from '../../../src/ol/imagetile';
import _ol_TileState_ from '../../../src/ol/tilestate';

describe('ol.Tile', function() {
  describe('interimChain', function() {
    var head, renderTile;
    beforeEach(function() {
      var tileCoord = [0, 0, 0];
      head = new _ol_ImageTile_(tileCoord, _ol_TileState_.IDLE);
      _ol_.getUid(head);

      var addToChain = function(tile, state) {
        var next = new _ol_ImageTile_(tileCoord, state);
        _ol_.getUid(next);
        tile.interimTile = next;
        return next;
      };
      var tail = addToChain(head, _ol_TileState_.IDLE); //discard, deprecated by head
      tail = addToChain(tail, _ol_TileState_.LOADING); //keep, request already going
      tail = addToChain(tail, _ol_TileState_.IDLE); //discard, deprecated by head
      tail = addToChain(tail, _ol_TileState_.LOADED); //keep, use for rendering
      renderTile = tail; //store this tile for later tests
      tail = addToChain(tail, _ol_TileState_.IDLE);  //rest of list outdated by tile above
      tail = addToChain(tail, _ol_TileState_.LOADED);
      tail = addToChain(tail, _ol_TileState_.LOADING);
      tail = addToChain(tail, _ol_TileState_.LOADED);

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
        expect(_ol_.getUid(head) < _ol_.getUid(head.interimTile));
        head = head.interimTile;
      }
      done();
    });
  });

});
