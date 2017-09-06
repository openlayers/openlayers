import _ol_proj_ from '../../../../src/ol/proj';
import _ol_proj_EPSG3857_ from '../../../../src/ol/proj/epsg3857';

describe('ol.proj.EPSG3857', function() {

  afterEach(function() {
    _ol_proj_.clearAllProjections();
    _ol_proj_.addCommon();
  });

  describe('fromEPSG4326()', function() {

    it('transforms from geographic to Web Mercator', function() {
      var forward = _ol_proj_EPSG3857_.fromEPSG4326;
      var edge = _ol_proj_EPSG3857_.HALF_SIZE;

      var tolerance = 1e-5;

      var cases = [{
        g: [0, 0],
        m: [0, 0]
      }, {
        g: [-180, -90],
        m: [-edge, -edge]
      }, {
        g: [180, 90],
        m: [edge, edge]
      }, {
        g: [-111.0429, 45.6770],
        m: [-12361239.084208, 5728738.469095]
      }];

      for (var i = 0, ii = cases.length; i < ii; ++i) {
        var point = cases[i].g;
        var transformed = forward(point);
        expect(transformed[0]).to.roughlyEqual(cases[i].m[0], tolerance);
        expect(transformed[1]).to.roughlyEqual(cases[i].m[1], tolerance);
      }
    });

  });

  describe('getPointResolution', function() {

    it('returns the correct point scale at the equator', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      var epsg3857 = _ol_proj_.get('EPSG:3857');
      var resolution = 19.11;
      var point = [0, 0];
      expect(_ol_proj_.getPointResolution(epsg3857, resolution, point)).
          to.roughlyEqual(19.11, 1e-1);
    });

    it('returns the correct point scale at the latitude of Toronto',
        function() {
          // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
          var epsg3857 = _ol_proj_.get('EPSG:3857');
          var epsg4326 = _ol_proj_.get('EPSG:4326');
          var resolution = 19.11;
          var point = _ol_proj_.transform([0, 43.65], epsg4326, epsg3857);
          expect(_ol_proj_.getPointResolution(epsg3857, resolution, point)).
              to.roughlyEqual(19.11 * Math.cos(Math.PI * 43.65 / 180), 1e-9);
        });

    it('returns the correct point scale at various latitudes', function() {
      // @see http://msdn.microsoft.com/en-us/library/aa940990.aspx
      var epsg3857 = _ol_proj_.get('EPSG:3857');
      var epsg4326 = _ol_proj_.get('EPSG:4326');
      var resolution = 19.11;
      var latitude;
      for (latitude = 0; latitude <= 85; ++latitude) {
        var point = _ol_proj_.transform([0, latitude], epsg4326, epsg3857);
        expect(_ol_proj_.getPointResolution(epsg3857, resolution, point)).
            to.roughlyEqual(19.11 * Math.cos(Math.PI * latitude / 180), 1e-9);
      }
    });

  });

});
