import ImageTile from '../../../../src/ol/ImageTile.js';
import Tile from '../../../../src/ol/Tile.js';
import TileState from '../../../../src/ol/TileState.js';
import {getUid} from '../../../../src/ol/util.js';

describe('ol.Tile', function () {
  describe('constructor', function () {
    it('sets a default transition', function () {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      expect(tile.transition_).to.equal(250);
    });

    it('allows the transition to be set', function () {
      const coord = [0, 0, 0];
      const transition = 500;
      const tile = new Tile(coord, TileState.IDLE, {transition: transition});
      expect(tile.transition_).to.equal(transition);
    });
  });

  describe('#getAlpha()', function () {
    it('returns the alpha value for a tile in transition', function () {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      const id = 'test';
      let time = Date.now();

      const startAlpha = tile.getAlpha(id, time);
      expect(startAlpha > 0).to.be(true);
      expect(startAlpha < 1).to.be(true);

      time += tile.transition_ / 2;
      const midAlpha = tile.getAlpha(id, time);
      expect(midAlpha > startAlpha).to.be(true);
      expect(midAlpha < 1).to.be(true);

      time += tile.transition_ / 2;
      const endAlpha = tile.getAlpha(id, time);
      expect(endAlpha).to.be(1);
    });
  });

  describe('#inTransition()', function () {
    it('determines if the tile is in transition', function () {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      const id = 'test';

      expect(tile.inTransition(id)).to.be(true);
      tile.endTransition(id);
      expect(tile.inTransition(id)).to.be(false);
    });
  });

  describe('interimChain', function () {
    let head, renderTile;
    beforeEach(function () {
      const tileCoord = [0, 0, 0];
      head = new ImageTile(tileCoord, TileState.IDLE);
      getUid(head);

      const addToChain = function (tile, state) {
        const next = new ImageTile(tileCoord, state);
        getUid(next);
        tile.interimTile = next;
        return next;
      };
      let tail = addToChain(head, TileState.IDLE); //discard, deprecated by head
      tail = addToChain(tail, TileState.LOADING); //keep, request already going
      tail = addToChain(tail, TileState.IDLE); //discard, deprecated by head
      tail = addToChain(tail, TileState.LOADED); //keep, use for rendering
      renderTile = tail; //store this tile for later tests
      tail = addToChain(tail, TileState.IDLE); //rest of list outdated by tile above
      tail = addToChain(tail, TileState.LOADED);
      tail = addToChain(tail, TileState.LOADING);
      tail = addToChain(tail, TileState.LOADED);
    });

    it('shrinks tile chain correctly', function (done) {
      const chainLength = function (tile) {
        let c = 0;
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

    it('gives the right tile to render', function (done) {
      expect(head.getInterimTile()).to.be(renderTile);
      head.refreshInterimChain();
      expect(head.getInterimTile()).to.be(renderTile);
      done();
    });

    it('discards everything after the render tile', function (done) {
      head.refreshInterimChain();
      expect(renderTile.interimTile).to.be(null);
      done();
    });

    it('preserves order of tiles', function (done) {
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
