import DataTile from '../../../../src/ol/DataTile.js';
import TileState from '../../../../src/ol/TileState.js';

describe('ol.DataTile', function () {
  /** @type {Promise<import('../../../../src/ol/DataTile.js').Data} */
  let loader;
  beforeEach(function () {
    loader = function () {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.fillStyle = 'red';
        context.fillRect(0, 0, 256, 256);
        resolve(context.getImageData(0, 0, 256, 256).data);
      });
    };
  });

  describe('constructor', function () {
    it('sets options', function () {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
        transition: 200,
      });
      expect(tile.tileCoord).to.equal(tileCoord);
      expect(tile.transition_).to.be(200);
      expect(tile.loader_).to.equal(loader);
    });
  });

  describe('#load()', function () {
    it('handles loading states correctly', function (done) {
      const tileCoord = [0, 0, 0];
      const tile = new DataTile({
        tileCoord: tileCoord,
        loader: loader,
      });
      expect(tile.getState()).to.be(TileState.IDLE);
      tile.load();
      expect(tile.getState()).to.be(TileState.LOADING);
      setTimeout(() => {
        expect(tile.getState()).to.be(TileState.LOADED);
        done();
      }, 16);
    });
  });
});
