goog.provide('ol.test.source.XYZ');

describe('ol.source.XYZ', function() {

  describe('tileUrlFunction', function() {

    var xyzTileSource, tileGrid;

    beforeEach(function() {
      xyzTileSource = new ol.source.XYZ({
        maxZoom: 6,
        url: '{z}/{x}/{y}'
      });
      tileGrid = xyzTileSource.getTileGrid();
    });

    it('return the expected URL', function() {
      var coordinate = new ol.Coordinate(829330.2064098881, 5933916.615134273);
      var tileUrl;

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl).to.eql('0/0/0');

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl).to.eql('1/1/0');

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl).to.eql('2/2/1');

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl).to.eql('3/4/2');

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl).to.eql('4/8/5');

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl).to.eql('5/16/11');

      tileUrl = xyzTileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl).to.eql('6/33/22');
    });

    describe('wrap x', function() {
      it('returns the expected URL', function() {
        var tileUrl = xyzTileSource.tileUrlFunction(
            new ol.TileCoord(6, -31, -23));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(new ol.TileCoord(6, 33, -23));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(new ol.TileCoord(6, 97, -23));
        expect(tileUrl).to.eql('6/33/22');
      });
    });

    describe('crop y', function() {
      it('returns the expected URL', function() {
        var tileUrl = xyzTileSource.tileUrlFunction(
            new ol.TileCoord(6, 33, -87));
        expect(tileUrl).to.be(undefined);

        tileUrl = xyzTileSource.tileUrlFunction(new ol.TileCoord(6, 33, -23));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(new ol.TileCoord(6, 33, 41));
        expect(tileUrl).to.be(undefined);
      });
    });
  });

  describe('forEachTileCoordParentTileRange', function() {
    it('iterates as expected', function() {
      var xyzTileGrid = new ol.tilegrid.XYZ({maxZoom: 6});

      var tileCoord = new ol.TileCoord(5, 11, 21);
      var zs = [], tileRanges = [];
      xyzTileGrid.forEachTileCoordParentTileRange(
          tileCoord,
          function(z, tileRange) {
            zs.push(z);
            tileRanges.push(tileRange);
            return false;
          });

      expect(zs.length).to.eql(5);
      expect(tileRanges.length).to.eql(5);

      expect(zs[0]).to.eql(4);
      expect(tileRanges[0].minX).to.eql(5);
      expect(tileRanges[0].minY).to.eql(10);
      expect(tileRanges[0].maxX).to.eql(5);
      expect(tileRanges[0].maxY).to.eql(10);

      expect(zs[1]).to.eql(3);
      expect(tileRanges[1].minX).to.eql(2);
      expect(tileRanges[1].minY).to.eql(5);
      expect(tileRanges[1].maxX).to.eql(2);
      expect(tileRanges[1].maxY).to.eql(5);

      expect(zs[2]).to.eql(2);
      expect(tileRanges[2].minX).to.eql(1);
      expect(tileRanges[2].minY).to.eql(2);
      expect(tileRanges[2].maxX).to.eql(1);
      expect(tileRanges[2].maxY).to.eql(2);

      expect(zs[3]).to.eql(1);
      expect(tileRanges[3].minX).to.eql(0);
      expect(tileRanges[3].minY).to.eql(1);
      expect(tileRanges[3].maxX).to.eql(0);
      expect(tileRanges[3].maxY).to.eql(1);

      expect(zs[4]).to.eql(0);
      expect(tileRanges[4].minX).to.eql(0);
      expect(tileRanges[4].minY).to.eql(0);
      expect(tileRanges[4].maxX).to.eql(0);
      expect(tileRanges[4].maxY).to.eql(0);
    });
  });

});

goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.tilegrid.XYZ');
goog.require('ol.source.XYZ');
