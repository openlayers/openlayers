import DataTile from '../../../../../src/ol/DataTile.js';
import DataTileSource from '../../../../../src/ol/source/DataTile.js';
import TileState from '../../../../../src/ol/TileState.js';

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
    it('gets tiles and fires a tileloadend event', function (done) {
      const tile = source.getTile(3, 2, 1);
      expect(tile).to.be.a(DataTile);
      expect(tile.state).to.be(TileState.IDLE);

      source.on('tileloadend', () => {
        expect(tile.state).to.be(TileState.LOADED);
        // decode tile coordinate from rgb
        expect(Array.from(tile.getData().slice(0, 3))).to.eql([3, 2, 1]);
        done();
      });

      tile.load();
    });
  });

  describe('#getInterpolate()', function () {
    it('is false by default', function () {
      const source = new DataTileSource({loader: () => {}});
      expect(source.getInterpolate()).to.be(false);
    });

    it('is true if constructed with interpoate: true', function () {
      const source = new DataTileSource({interpolate: true, loader: () => {}});
      expect(source.getInterpolate()).to.be(true);
    });
  });
});
