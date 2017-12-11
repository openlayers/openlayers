import _ol_Tile_ from '../../../src/ol/Tile.js';
import _ol_TileCache_ from '../../../src/ol/TileCache.js';
import _ol_tilecoord_ from '../../../src/ol/tilecoord.js';


describe('ol.TileCache', function() {

  describe('#pruneExceptNewestZ()', function() {
    it('gets rid of all entries that are not at the newest z', function() {
      var tiles = [
        new _ol_Tile_([0, 0, 0]),
        new _ol_Tile_([1, 0, 0]),
        new _ol_Tile_([1, 1, 0]),
        new _ol_Tile_([2, 0, 0]),
        new _ol_Tile_([2, 1, 0]),
        new _ol_Tile_([2, 2, 0]),
        new _ol_Tile_([2, 3, 0]) // newest tile at z: 2
      ];
      var cache = new _ol_TileCache_();

      sinon.spy(tiles[0], 'dispose');

      tiles.forEach(function(tile) {
        cache.set(_ol_tilecoord_.getKey(tile.tileCoord), tile);
      });

      cache.pruneExceptNewestZ();

      expect(cache.getKeys()).to.eql([
        '2/3/0',
        '2/2/0',
        '2/1/0',
        '2/0/0'
      ]);

      expect(tiles[0].dispose.calledOnce).to.be(true);
    });
  });
});
