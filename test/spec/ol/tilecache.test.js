goog.require('ol.Tile');
goog.require('ol.TileCache');
goog.require('ol.tilecoord');


describe('ol.TileCache', function() {

  describe('#pruneExceptNewestZ()', function() {
    it('gets rid of all entries that are not at the newest z', function() {
      var tiles = [
        new ol.Tile([0, 0, 0]),
        new ol.Tile([1, 0, 0]),
        new ol.Tile([1, 1, 0]),
        new ol.Tile([2, 0, 0]),
        new ol.Tile([2, 1, 0]),
        new ol.Tile([2, 2, 0]),
        new ol.Tile([2, 3, 0]) // newest tile at z: 2
      ];
      var cache = new ol.TileCache();

      sinon.spy(tiles[0], 'dispose');

      tiles.forEach(function(tile) {
        cache.set(ol.tilecoord.getKey(tile.tileCoord), tile);
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
