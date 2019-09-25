import {getUid} from '../../../src/ol/util.js';
import ImageTile from '../../../src/ol/ImageTile.js';
import Tile from '../../../src/ol/Tile.js';
import TileState from '../../../src/ol/TileState.js';


describe('ol.Tile', () => {
  describe('constructor', () => {
    test('sets a default transition', () => {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      expect(tile.transition_).toBe(250);
    });

    test('allows the transition to be set', () => {
      const coord = [0, 0, 0];
      const transition = 500;
      const tile = new Tile(coord, TileState.IDLE, {transition: transition});
      expect(tile.transition_).toBe(transition);
    });
  });

  describe('#getAlpha()', () => {
    test('returns the alpha value for a tile in transition', () => {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      const id = 'test';
      let time = Date.now();

      const startAlpha = tile.getAlpha(id, time);
      expect(startAlpha > 0).toBe(true);
      expect(startAlpha < 1).toBe(true);

      time += tile.transition_ / 2;
      const midAlpha = tile.getAlpha(id, time);
      expect(midAlpha > startAlpha).toBe(true);
      expect(midAlpha < 1).toBe(true);

      time += tile.transition_ / 2;
      const endAlpha = tile.getAlpha(id, time);
      expect(endAlpha).toBe(1);
    });
  });

  describe('#inTransition()', () => {
    test('determines if the tile is in transition', () => {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      const id = 'test';

      expect(tile.inTransition(id)).toBe(true);
      tile.endTransition(id);
      expect(tile.inTransition(id)).toBe(false);
    });
  });

  describe('interimChain', () => {
    let head, renderTile;
    beforeEach(() => {
      const tileCoord = [0, 0, 0];
      head = new ImageTile(tileCoord, TileState.IDLE);
      getUid(head);

      const addToChain = function(tile, state) {
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

    test('shrinks tile chain correctly', done => {
      const chainLength = function(tile) {
        let c = 0;
        while (tile) {
          ++c;
          tile = tile.interimTile;
        }
        return c;
      };

      expect(chainLength(head)).toBe(9);
      head.refreshInterimChain();
      expect(chainLength(head)).toBe(3);
      done();
    });

    test('gives the right tile to render', done => {
      expect(head.getInterimTile()).toBe(renderTile);
      head.refreshInterimChain();
      expect(head.getInterimTile()).toBe(renderTile);
      done();
    });

    test('discards everything after the render tile', done => {
      head.refreshInterimChain();
      expect(renderTile.interimTile).toBe(null);
      done();
    });

    test('preserves order of tiles', done => {
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
