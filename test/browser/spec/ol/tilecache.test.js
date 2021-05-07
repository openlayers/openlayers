import Tile from '../../../../src/ol/Tile.js';
import TileCache from '../../../../src/ol/TileCache.js';
import {getKey} from '../../../../src/ol/tilecoord.js';

describe('ol.TileCache', function () {
  describe('#pruneExceptNewestZ()', function () {
    it('gets rid of all entries that are not at the newest z', function () {
      const tiles = [
        new Tile([0, 0, 0]),
        new Tile([1, 0, 0]),
        new Tile([1, 1, 0]),
        new Tile([2, 0, 0]),
        new Tile([2, 1, 0]),
        new Tile([2, 2, 0]),
        new Tile([2, 3, 0]), // newest tile at z: 2
      ];
      const cache = new TileCache();

      sinon.spy(tiles[0], 'dispose');

      tiles.forEach(function (tile) {
        cache.set(getKey(tile.tileCoord), tile);
      });

      cache.pruneExceptNewestZ();

      expect(cache.getKeys()).to.eql(['2/3/0', '2/2/0', '2/1/0', '2/0/0']);
    });
  });
});
