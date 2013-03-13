goog.provide('ol.test.tilegrid.XYZ');


describe('ol.tilegrid.XYZ', function() {

  describe('getResolution', function() {

    it('returns the correct resolution at the equator', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      var xyzTileGrid = new ol.tilegrid.XYZ({
        maxZoom: 22
      });
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


goog.require('ol.tilegrid.XYZ');
