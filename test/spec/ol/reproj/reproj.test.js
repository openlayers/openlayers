

import _ol_reproj_ from '../../../../src/ol/reproj';
import _ol_proj_ from '../../../../src/ol/proj';


describe('ol.reproj', function() {

  describe('#calculateSourceResolution', function() {
    var proj3857 = _ol_proj_.get('EPSG:3857');
    var proj4326 = _ol_proj_.get('EPSG:4326');
    var origin = [0, 0];
    var point3857 = [50, 40];
    var point4326 = _ol_proj_.transform(point3857, proj3857, proj4326);

    it('is identity for identical projection', function() {
      var result;
      var resolution = 500;
      result = _ol_reproj_.calculateSourceResolution(
          proj3857, proj3857, origin, resolution);
      expect(result).to.be(resolution);

      result = _ol_reproj_.calculateSourceResolution(
          proj3857, proj3857, point3857, resolution);
      expect(result).to.be(resolution);

      result = _ol_reproj_.calculateSourceResolution(
          proj4326, proj4326, point4326, resolution);
      expect(result).to.be(resolution);
    });

    it('calculates correctly', function() {
      var resolution4326 = 5;

      var resolution3857 = _ol_reproj_.calculateSourceResolution(
          proj3857, proj4326, point4326, resolution4326);
      expect(resolution3857).not.to.be(resolution4326);
      expect(resolution3857).to.roughlyEqual(
          5 * proj4326.getMetersPerUnit(), 1e-4);

      var result = _ol_reproj_.calculateSourceResolution(
          proj4326, proj3857, point3857, resolution3857);
      expect(result).to.be(resolution4326);
    });
  });
});
