goog.provide('ol.test.reproj');

describe('ol.reproj', function() {

  describe('#calculateSourceResolution', function() {
    var proj3857 = ol.proj.get('EPSG:3857');
    var proj4326 = ol.proj.get('EPSG:4326');
    var origin = [0, 0];
    var point3857 = [50, 40];
    var point4326 = ol.proj.transform(point3857, proj3857, proj4326);

    it('is identity for identical projection', function() {
      var result;
      var resolution = 500;
      result = ol.reproj.calculateSourceResolution(
          proj3857, proj3857, origin, resolution);
      expect(result).to.be(resolution);

      result = ol.reproj.calculateSourceResolution(
          proj3857, proj3857, point3857, resolution);
      expect(result).to.be(resolution);

      result = ol.reproj.calculateSourceResolution(
          proj4326, proj4326, point4326, resolution);
      expect(result).to.be(resolution);
    });

    it('calculates correctly', function() {
      var resolution4326 = 5;

      var resolution3857 = ol.reproj.calculateSourceResolution(
          proj3857, proj4326, point4326, resolution4326);
      expect(resolution3857).not.to.be(resolution4326);
      expect(resolution3857).to.roughlyEqual(555974.3714343394, 1e-6);

      var result = ol.reproj.calculateSourceResolution(
          proj4326, proj3857, point3857, resolution3857);
      expect(result).to.be(resolution4326);
    });
  });
});


goog.require('ol.reproj');
goog.require('ol.proj');
