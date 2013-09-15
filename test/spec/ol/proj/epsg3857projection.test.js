goog.provide('ol.test.proj.EPSG3857');


describe('ol.proj.EPSG3857', function() {

  beforeEach(function() {
    ol.proj.common.add();
  });

  afterEach(function() {
    ol.proj.clearAllProjections();
  });

  describe('getPointResolution', function() {

    it('returns the correct point scale at the equator', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      var epsg3857 = ol.proj.get('EPSG:3857');
      var resolution = 19.11;
      var point = [0, 0];
      expect(epsg3857.getPointResolution(resolution, point)).
          to.roughlyEqual(19.11, 1e-1);
    });

    it('returns the correct point scale at the latitude of Toronto',
        function() {
          // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
          var epsg3857 = ol.proj.get('EPSG:3857');
          var epsg4326 = ol.proj.get('EPSG:4326');
          var resolution = 19.11;
          var point = ol.proj.transform([0, 43.65], epsg4326, epsg3857);
          expect(epsg3857.getPointResolution(resolution, point)).
              to.roughlyEqual(19.11 * Math.cos(Math.PI * 43.65 / 180), 1e-9);
        });

    it('returns the correct point scale at various latitudes', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      var epsg3857 = ol.proj.get('EPSG:3857');
      var epsg4326 = ol.proj.get('EPSG:4326');
      var resolution = 19.11;
      var latitude;
      for (latitude = 0; latitude < 90; ++latitude) {
        var point = ol.proj.transform([0, latitude], epsg4326, epsg3857);
        expect(epsg3857.getPointResolution(resolution, point)).
            to.roughlyEqual(19.11 * Math.cos(Math.PI * latitude / 180), 1e-9);
      }
    });

  });

});


goog.require('ol.proj');
goog.require('ol.proj.common');
goog.require('ol.proj.EPSG3857');
