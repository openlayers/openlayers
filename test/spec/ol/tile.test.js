import {getUid} from '../../../src/ol/index.js';
import _ol_ImageTile_ from '../../../src/ol/ImageTile.js';
import _ol_Tile_ from '../../../src/ol/Tile.js';
import TileState from '../../../src/ol/TileState.js';


describe('ol.Tile', function() {
  describe('constructor', function()  {
    it('sets a default transition', function() {
      var coord = [0, 0, 0];
      var tile = new _ol_Tile_(coord, TileState.IDLE);
      expect(tile.transition_).to.equal(250);
    });

    it('allows the transition to be set', function() {
      var coord = [0, 0, 0];
      var transition = 500;
      var tile = new _ol_Tile_(coord, TileState.IDLE, {transition: transition});
      expect(tile.transition_).to.equal(transition);
    });
  });

  describe('#getAlpha()', function() {
    it('returns the alpha value for a tile in transition', function() {
      var coord = [0, 0, 0];
      var tile = new _ol_Tile_(coord, TileState.IDLE);
      var id = 'test';
      var time = Date.now();

      var startAlpha = tile.getAlpha(id, time);
      expect(startAlpha > 0).to.be(true);
      expect(startAlpha < 1).to.be(true);

      time += tile.transition_ / 2;
      var midAlpha = tile.getAlpha(id, time);
      expect(midAlpha > startAlpha).to.be(true);
      expect(midAlpha < 1).to.be(true);

      time += tile.transition_ / 2;
      var endAlpha = tile.getAlpha(id, time);
      expect(endAlpha).to.be(1);
    });
  });

  describe('#inTransition()', function() {
    it('determines if the tile is in transition', function() {
      var coord = [0, 0, 0];
      var tile = new _ol_Tile_(coord, TileState.IDLE);
      var id = 'test';

      expect(tile.inTransition(id)).to.be(true);
      tile.endTransition(id);
      expect(tile.inTransition(id)).to.be(false);
    });
  });

  describe('interimChain', function() {
    var head, renderTile;
    beforeEach(function() {
      var tileCoord = [0, 0, 0];
      head = new _ol_ImageTile_(tileCoord, TileState.IDLE);
      getUid(head);

      var addToChain = function(tile, state) {
        var next = new _ol_ImageTile_(tileCoord, state);
        getUid(next);
        tile.interimTile = next;
        return next;
      };
      var tail = addToChain(head, TileState.IDLE); //discard, deprecated by head
      tail = addToChain(tail, TileState.LOADING); //keep, request already going
      tail = addToChain(tail, TileState.IDLE); //discard, deprecated by head
      tail = addToChain(tail, TileState.LOADED); //keep, use for rendering
      renderTile = tail; //store this tile for later tests
      tail = addToChain(tail, TileState.IDLE);  //rest of list outdated by tile above
      tail = addToChain(tail, TileState.LOADED);
      tail = addToChain(tail, TileState.LOADING);
      tail = addToChain(tail, TileState.LOADED);

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
        expect(getUid(head) < getUid(head.interimTile));
        head = head.interimTile;
      }
      done();
    });
  });

});
