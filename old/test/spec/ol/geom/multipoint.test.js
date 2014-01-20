goog.provide('ol.test.geom.MultiPoint');

describe('ol.geom.MultiPoint', function() {

  describe('constructor', function() {

    it('creates a multi-point from an array', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      expect(multi).to.be.a(ol.geom.MultiPoint);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

  });

  describe('#components', function() {

    it('is an array of points', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);

      var components = multi.getComponents();
      expect(components.length).to.be(2);
      expect(components[0]).to.be.a(ol.geom.Point);
      expect(components[1]).to.be.a(ol.geom.Point);

    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      var bounds = multi.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[2]).to.be(30);
      expect(bounds[1]).to.be(20);
      expect(bounds[3]).to.be(40);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      expect(multi.getCoordinates()).to.eql([[10, 20], [30, 40]]);
    });

  });

  describe('#transform', function() {

    var forward = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
    var inverse = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

    it('forward transforms a multi-point', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      multi.transform(forward);

      var components = multi.getComponents();
      expect(components[0].get(0)).to.roughlyEqual(1113195, 1);
      expect(components[0].get(1)).to.roughlyEqual(2273031, 1);
      expect(components[1].get(0)).to.roughlyEqual(3339584, 1);
      expect(components[1].get(1)).to.roughlyEqual(4865942, 1);
    });

    it('inverse transforms a multi-point', function() {
      var multi = new ol.geom.MultiPoint(
          [[1113195, 2273031], [3339584, 4865942]]);
      multi.transform(inverse);

      var components = multi.getComponents();
      expect(components[0].get(0)).to.roughlyEqual(10, 0.001);
      expect(components[0].get(1)).to.roughlyEqual(20, 0.001);
      expect(components[1].get(0)).to.roughlyEqual(30, 0.001);
      expect(components[1].get(1)).to.roughlyEqual(40, 0.001);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.proj');
