import Tile from '../../../../src/ol/Tile.js';
import TileState from '../../../../src/ol/TileState.js';

describe('ol/Tile', function () {
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
});
