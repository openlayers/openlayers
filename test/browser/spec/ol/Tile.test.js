import {assert} from 'chai';
import Tile from '../../../../src/ol/Tile.js';
import TileState from '../../../../src/ol/TileState.js';

describe('ol/Tile', function () {
  describe('constructor', function () {
    it('sets a default transition', function () {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      assert.equal(tile.transition_, 250);
    });

    it('allows the transition to be set', function () {
      const coord = [0, 0, 0];
      const transition = 500;
      const tile = new Tile(coord, TileState.IDLE, {transition: transition});
      assert.equal(tile.transition_, transition);
    });
  });

  describe('#getAlpha()', function () {
    it('returns the alpha value for a tile in transition', function () {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      const id = 'test';
      let time = Date.now();

      const startAlpha = tile.getAlpha(id, time);
      assert.strictEqual(startAlpha > 0, true);
      assert.strictEqual(startAlpha < 1, true);

      time += tile.transition_ / 2;
      const midAlpha = tile.getAlpha(id, time);
      assert.strictEqual(midAlpha > startAlpha, true);
      assert.strictEqual(midAlpha < 1, true);

      time += tile.transition_ / 2;
      const endAlpha = tile.getAlpha(id, time);
      assert.strictEqual(endAlpha, 1);
    });
  });

  describe('#inTransition()', function () {
    it('determines if the tile is in transition', function () {
      const coord = [0, 0, 0];
      const tile = new Tile(coord, TileState.IDLE);
      const id = 'test';

      assert.strictEqual(tile.inTransition(id), true);
      tile.endTransition(id);
      assert.strictEqual(tile.inTransition(id), false);
    });
  });
});
