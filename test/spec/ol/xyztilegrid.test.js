goog.provide('ol.test.tilegrid.XYZ');


describe('ol.tilegrid.XYZ', function() {

  describe('getResolution', function() {

    it('returns the correct resolution at the equator', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      var xyzTileGrid = new ol.tilegrid.XYZ({
        maxZoom: 22
      });
      expect(xyzTileGrid.getResolution(0)).toRoughlyEqual(156543.04, 1e-2);
      expect(xyzTileGrid.getResolution(1)).toRoughlyEqual(78271.52, 1e-2);
      expect(xyzTileGrid.getResolution(2)).toRoughlyEqual(39135.76, 1e-2);
      expect(xyzTileGrid.getResolution(3)).toRoughlyEqual(19567.88, 1e-2);
      expect(xyzTileGrid.getResolution(4)).toRoughlyEqual(9783.94, 1e-2);
      expect(xyzTileGrid.getResolution(5)).toRoughlyEqual(4891.97, 1e-2);
      expect(xyzTileGrid.getResolution(6)).toRoughlyEqual(2445.98, 1e-2);
      expect(xyzTileGrid.getResolution(7)).toRoughlyEqual(1222.99, 1e-2);
      expect(xyzTileGrid.getResolution(8)).toRoughlyEqual(611.50, 1e-2);
      expect(xyzTileGrid.getResolution(9)).toRoughlyEqual(305.75, 1e-2);
      expect(xyzTileGrid.getResolution(10)).toRoughlyEqual(152.87, 1e-2);
      expect(xyzTileGrid.getResolution(11)).toRoughlyEqual(76.44, 1e-2);
      expect(xyzTileGrid.getResolution(12)).toRoughlyEqual(38.22, 1e-2);
      expect(xyzTileGrid.getResolution(13)).toRoughlyEqual(19.11, 1e-2);
      expect(xyzTileGrid.getResolution(14)).toRoughlyEqual(9.55, 1e-2);
      expect(xyzTileGrid.getResolution(15)).toRoughlyEqual(4.78, 1e-2);
      expect(xyzTileGrid.getResolution(16)).toRoughlyEqual(2.39, 1e-2);
      expect(xyzTileGrid.getResolution(17)).toRoughlyEqual(1.19, 1e-2);
      expect(xyzTileGrid.getResolution(18)).toRoughlyEqual(0.60, 1e-2);
      expect(xyzTileGrid.getResolution(19)).toRoughlyEqual(0.30, 1e-2);
    });

  });

});


goog.require('ol.tilegrid.XYZ');
