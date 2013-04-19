goog.provide('ol.test.geom.MultiPoint');

describe('ol.geom.MultiPoint', function() {

  describe('constructor', function() {

    it('creates a multi-point from an array', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      expect(multi).to.be.a(ol.geom.MultiPoint);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

    it('throws when given with insufficient dimensions', function() {
      expect(function() {
        var multi = new ol.geom.MultiPoint([1]);
      }).to.throwException();
    });

  });

  describe('#components', function() {

    it('is an array of points', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);

      expect(multi.components.length).to.be(2);
      expect(multi.components[0]).to.be.a(ol.geom.Point);
      expect(multi.components[1]).to.be.a(ol.geom.Point);

    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      expect(multi.dimension).to.be(2);
    });

    it('can be 3', function() {
      var multi = new ol.geom.MultiPoint([[10, 20, 30], [30, 40, 50]]);
      expect(multi.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      var bounds = multi.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[1]).to.be(30);
      expect(bounds[2]).to.be(20);
      expect(bounds[3]).to.be(40);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var multi = new ol.geom.MultiPoint([[10, 20], [30, 40]]);
      expect(multi.getCoordinates()).to.eql([[10, 20], [30, 40]]);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
