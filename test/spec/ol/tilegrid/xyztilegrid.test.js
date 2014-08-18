goog.provide('ol.test.tilegrid.XYZ');


describe('ol.tilegrid.XYZ', function() {

  var xyzTileGrid;
  beforeEach(function() {
    xyzTileGrid = new ol.tilegrid.XYZ({
      maxZoom: 22
    });
  });

  describe('forEachTileCoordParentTileRange', function() {

    it('iterates as expected', function() {

      var tileCoord = [5, 11, 21];
      var zs = [], tileRanges = [];
      xyzTileGrid.forEachTileCoordParentTileRange(
          tileCoord,
          function(z, tileRange) {
            zs.push(z);
            tileRanges.push(new ol.TileRange(
                tileRange.minX, tileRange.maxX,
                tileRange.minY, tileRange.maxY));
            return false;
          });

      expect(zs.length).to.eql(5);
      expect(tileRanges.length).to.eql(5);

      expect(zs[0]).to.eql(4);
      expect(tileRanges[0].minX).to.eql(5);
      expect(tileRanges[0].maxX).to.eql(5);
      expect(tileRanges[0].minY).to.eql(10);
      expect(tileRanges[0].maxY).to.eql(10);

      expect(zs[1]).to.eql(3);
      expect(tileRanges[1].minX).to.eql(2);
      expect(tileRanges[1].maxX).to.eql(2);
      expect(tileRanges[1].minY).to.eql(5);
      expect(tileRanges[1].maxY).to.eql(5);

      expect(zs[2]).to.eql(2);
      expect(tileRanges[2].minX).to.eql(1);
      expect(tileRanges[2].maxX).to.eql(1);
      expect(tileRanges[2].minY).to.eql(2);
      expect(tileRanges[2].maxY).to.eql(2);

      expect(zs[3]).to.eql(1);
      expect(tileRanges[3].minX).to.eql(0);
      expect(tileRanges[3].maxX).to.eql(0);
      expect(tileRanges[3].minY).to.eql(1);
      expect(tileRanges[3].maxY).to.eql(1);

      expect(zs[4]).to.eql(0);
      expect(tileRanges[4].minX).to.eql(0);
      expect(tileRanges[4].maxX).to.eql(0);
      expect(tileRanges[4].minY).to.eql(0);
      expect(tileRanges[4].maxY).to.eql(0);

    });

  });

  describe('getResolution', function() {

    it('returns the correct resolution at the equator', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      expect(xyzTileGrid.getResolution(0)).to.roughlyEqual(156543.04, 1e-2);
      expect(xyzTileGrid.getResolution(1)).to.roughlyEqual(78271.52, 1e-2);
      expect(xyzTileGrid.getResolution(2)).to.roughlyEqual(39135.76, 1e-2);
      expect(xyzTileGrid.getResolution(3)).to.roughlyEqual(19567.88, 1e-2);
      expect(xyzTileGrid.getResolution(4)).to.roughlyEqual(9783.94, 1e-2);
      expect(xyzTileGrid.getResolution(5)).to.roughlyEqual(4891.97, 1e-2);
      expect(xyzTileGrid.getResolution(6)).to.roughlyEqual(2445.98, 1e-2);
      expect(xyzTileGrid.getResolution(7)).to.roughlyEqual(1222.99, 1e-2);
      expect(xyzTileGrid.getResolution(8)).to.roughlyEqual(611.50, 1e-2);
      expect(xyzTileGrid.getResolution(9)).to.roughlyEqual(305.75, 1e-2);
      expect(xyzTileGrid.getResolution(10)).to.roughlyEqual(152.87, 1e-2);
      expect(xyzTileGrid.getResolution(11)).to.roughlyEqual(76.44, 1e-2);
      expect(xyzTileGrid.getResolution(12)).to.roughlyEqual(38.22, 1e-2);
      expect(xyzTileGrid.getResolution(13)).to.roughlyEqual(19.11, 1e-2);
      expect(xyzTileGrid.getResolution(14)).to.roughlyEqual(9.55, 1e-2);
      expect(xyzTileGrid.getResolution(15)).to.roughlyEqual(4.78, 1e-2);
      expect(xyzTileGrid.getResolution(16)).to.roughlyEqual(2.39, 1e-2);
      expect(xyzTileGrid.getResolution(17)).to.roughlyEqual(1.19, 1e-2);
      expect(xyzTileGrid.getResolution(18)).to.roughlyEqual(0.60, 1e-2);
      expect(xyzTileGrid.getResolution(19)).to.roughlyEqual(0.30, 1e-2);
    });

  });

});


goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.tilegrid.XYZ');
