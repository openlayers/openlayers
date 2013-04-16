goog.provide('ol.test.filter.Extent');


describe('ol.filter.Extent', function() {

  var extent, filter;

  beforeEach(function() {
    extent = [0, 45, 0, 90];
    filter = new ol.filter.Extent(extent);
  });

  describe('#getExtent()', function() {

    it('returns the configured extent', function() {
      expect(filter.getExtent()).to.be(extent);
    });

  });

  describe('#evaluate()', function() {

    it('returns true if a feature intersects, false if not', function() {
      expect(filter.applies(new ol.Feature({g: new ol.geom.Point([44, 89])})))
          .to.be(true);
      expect(filter.applies(new ol.Feature({g: new ol.geom.Point([46, 91])})))
          .to.be(false);
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.filter.Extent');
goog.require('ol.geom.Point');
