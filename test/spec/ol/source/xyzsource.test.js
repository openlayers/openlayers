goog.provide('ol.test.source.XYZ');


describe('ol.source.XYZ', function() {

  describe('tileURLFunction', function() {

    var xyzTileSource, tileGrid;

    beforeEach(function() {
      xyzTileSource = new ol.source.XYZ({
        maxZoom: 6,
        url: '{z}/{x}/{y}'
      });
      tileGrid = xyzTileSource.getTileGrid();
    });

    it('return the expected URL', function() {

      var coordinate = [829330.2064098881, 5933916.615134273];
      var tileURL;

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileURL).to.eql('0/0/0');

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileURL).to.eql('1/1/0');

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileURL).to.eql('2/2/1');

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileURL).to.eql('3/4/2');

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileURL).to.eql('4/8/5');

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileURL).to.eql('5/16/11');

      tileURL = xyzTileSource.tileURLFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileURL).to.eql('6/33/22');

    });

    describe('wrap x', function() {

      it('returns the expected URL', function() {
        var tileURL = xyzTileSource.tileURLFunction(
            new ol.TileCoord(6, -31, -23));
        expect(tileURL).to.eql('6/33/22');

        tileURL = xyzTileSource.tileURLFunction(new ol.TileCoord(6, 33, -23));
        expect(tileURL).to.eql('6/33/22');

        tileURL = xyzTileSource.tileURLFunction(new ol.TileCoord(6, 97, -23));
        expect(tileURL).to.eql('6/33/22');
      });

    });

    describe('crop y', function() {

      it('returns the expected URL', function() {
        var tileURL = xyzTileSource.tileURLFunction(
            new ol.TileCoord(6, 33, -87));
        expect(tileURL).to.be(undefined);

        tileURL = xyzTileSource.tileURLFunction(new ol.TileCoord(6, 33, -23));
        expect(tileURL).to.eql('6/33/22');

        tileURL = xyzTileSource.tileURLFunction(new ol.TileCoord(6, 33, 41));
        expect(tileURL).to.be(undefined);
      });

    });

  });

});

goog.require('ol.TileCoord');
goog.require('ol.source.XYZ');
