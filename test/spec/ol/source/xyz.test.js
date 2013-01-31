goog.provide('ol.test.source.XYZ');

describe('ol.source.XYZ', function() {

  describe('getTileCoordUrl', function() {

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

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl).toEqual('0/0/0');

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl).toEqual('1/1/0');

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl).toEqual('2/2/1');

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl).toEqual('3/4/2');

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl).toEqual('4/8/5');

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl).toEqual('5/16/11');

      tileUrl = xyzTileSource.getTileCoordUrl(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl).toEqual('6/33/22');
    });

    describe('wrap x', function() {
      it('returns the expected URL', function() {
        var tileUrl = xyzTileSource.getTileCoordUrl(
            new ol.TileCoord(6, -31, -23));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = xyzTileSource.getTileCoordUrl(new ol.TileCoord(6, 33, -23));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = xyzTileSource.getTileCoordUrl(new ol.TileCoord(6, 97, -23));
        expect(tileUrl).toEqual('6/33/22');
      });
    });

    describe('crop y', function() {
      it('returns the expected URL', function() {
        var tileUrl = xyzTileSource.getTileCoordUrl(
            new ol.TileCoord(6, 33, -87));
        expect(tileUrl).toBeUndefined();

        tileUrl = xyzTileSource.getTileCoordUrl(new ol.TileCoord(6, 33, -23));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = xyzTileSource.getTileCoordUrl(new ol.TileCoord(6, 33, 41));
        expect(tileUrl).toBeUndefined();
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

      expect(zs.length).toEqual(5);
      expect(tileRanges.length).toEqual(5);

      expect(zs[0]).toEqual(4);
      expect(tileRanges[0].minX).toEqual(5);
      expect(tileRanges[0].minY).toEqual(10);
      expect(tileRanges[0].maxX).toEqual(5);
      expect(tileRanges[0].maxY).toEqual(10);

      expect(zs[1]).toEqual(3);
      expect(tileRanges[1].minX).toEqual(2);
      expect(tileRanges[1].minY).toEqual(5);
      expect(tileRanges[1].maxX).toEqual(2);
      expect(tileRanges[1].maxY).toEqual(5);

      expect(zs[2]).toEqual(2);
      expect(tileRanges[2].minX).toEqual(1);
      expect(tileRanges[2].minY).toEqual(2);
      expect(tileRanges[2].maxX).toEqual(1);
      expect(tileRanges[2].maxY).toEqual(2);

      expect(zs[3]).toEqual(1);
      expect(tileRanges[3].minX).toEqual(0);
      expect(tileRanges[3].minY).toEqual(1);
      expect(tileRanges[3].maxX).toEqual(0);
      expect(tileRanges[3].maxY).toEqual(1);

      expect(zs[4]).toEqual(0);
      expect(tileRanges[4].minX).toEqual(0);
      expect(tileRanges[4].minY).toEqual(0);
      expect(tileRanges[4].maxX).toEqual(0);
      expect(tileRanges[4].maxY).toEqual(0);
    });
  });

});

goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.XYZ');
