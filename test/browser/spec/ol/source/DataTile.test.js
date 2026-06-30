import {assert} from 'chai';
import DataTile from '../../../../../src/ol/DataTile.js';
import TileState from '../../../../../src/ol/TileState.js';
import DataTileSource from '../../../../../src/ol/source/DataTile.js';

describe('ol/source/DataTile', function () {
  /** @type {DataTileSource} */
  let source;
  beforeEach(function () {
    const loader = function (z, x, y) {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        // encode tile coordinate in rgb
        context.fillStyle = `rgb(${z}, ${x % 255}, ${y % 255})`;
        context.fillRect(0, 0, 256, 256);
        resolve(context.getImageData(0, 0, 256, 256).data);
      });
    };
    source = new DataTileSource({
      loader: loader,
    });
  });

  describe('#getTile()', function () {
    it('gets tiles and fires a tileloadend event', () =>
      new Promise((resolve) => {
        const tile = source.getTile(3, 2, 1);
        assert.instanceOf(tile, DataTile);
        assert.strictEqual(tile.state, TileState.IDLE);

        source.on('tileloadend', () => {
          assert.strictEqual(tile.state, TileState.LOADED);
          assert.deepEqual(Array.from(tile.getData().slice(0, 3)), [3, 2, 1]);
          resolve();
        });

        tile.load();
      }));
  });

  describe('#getTileSize()', function () {
    it('returns [256, 256] by default', function () {
      const source = new DataTileSource({});
      assert.deepEqual(source.getTileSize(0), [256, 256]);
    });

    it('respects a tileSize passed to the constructor', function () {
      const size = [1234, 5678];
      const source = new DataTileSource({tileSize: size});
      assert.deepEqual(source.getTileSize(0), size);
    });

    it('picks from an array of sizes passed to setTileSizes()', function () {
      const sizes = [
        [123, 456],
        [234, 567],
        [345, 678],
      ];
      const source = new DataTileSource({});
      source.setTileSizes(sizes);
      assert.deepEqual(source.getTileSize(1), sizes[1]);
    });
  });

  describe('#getInterpolate()', function () {
    it('is false by default', function () {
      const source = new DataTileSource({loader: () => {}});
      assert.strictEqual(source.getInterpolate(), false);
    });

    it('is true if constructed with interpoate: true', function () {
      const source = new DataTileSource({interpolate: true, loader: () => {}});
      assert.strictEqual(source.getInterpolate(), true);
    });
  });
});
