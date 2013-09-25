goog.provide('ol.test.geom.Point');

describe('ol.geom.Point', function() {

  describe('constructor', function() {

    it('creates a point from an array', function() {
      var point = new ol.geom.Point([10, 20]);
      expect(point).to.be.a(ol.geom.Point);
      expect(point).to.be.a(ol.geom.Geometry);
    });

    it('throws when given with insufficient dimensions', function() {
      expect(function() {
        var point = new ol.geom.Point([1]);
        point = point; // suppress gjslint warning about unused variable
      }).to.throwException();
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var point = new ol.geom.Point([10, 20]);
      expect(point.dimension).to.be(2);
    });

    it('can be 3', function() {
      var point = new ol.geom.Point([10, 20, 30]);
      expect(point.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var point = new ol.geom.Point([10, 20]);
      var bounds = point.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[2]).to.be(10);
      expect(bounds[1]).to.be(20);
      expect(bounds[3]).to.be(20);
    });

  });

  describe('#getCoordinates()', function() {

    it('returns an array', function() {
      var point = new ol.geom.Point([10, 20]);
      expect(point.getCoordinates()).to.eql([10, 20]);
    });

  });

  describe('#transform()', function() {

    var forward = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
    var inverse = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

    it('forward transforms a point in place', function() {
      var point = new ol.geom.Point([10, 20]);
      point.transform(forward);
      expect(point.get(0)).to.roughlyEqual(1113195, 1);
      expect(point.get(1)).to.roughlyEqual(2273031, 1);
    });

    it('inverse transforms a point in place', function() {
      var point = new ol.geom.Point([1113195, 2273031]);
      point.transform(inverse);
      expect(point.get(0)).to.roughlyEqual(10, 0.001);
      expect(point.get(1)).to.roughlyEqual(20, 0.001);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.Point');
goog.require('ol.proj');
