goog.provide('ol.test.geom.Polygon');

describe('ol.geom.Polygon', function() {

  var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];

  describe('constructor', function() {

    it('creates a polygon from an array', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly).to.be.a(ol.geom.Polygon);
      expect(poly).to.be.a(ol.geom.Geometry);
    });

    it('throws when given mismatched dimension', function() {
      expect(function() {
        var poly = new ol.geom.Polygon([[[10, 20], [30, 40, 50]]]);
      }).to.throwException();
    });

    it('accepts shared vertices', function() {
      var vertices = new ol.geom.SharedVertices();
      var p1 = new ol.geom.Polygon([outer], vertices);
      var p2 = new ol.geom.Polygon([outer, inner1], vertices);
      var p3 = new ol.geom.Polygon([outer, inner2], vertices);
      expect(p1.getCoordinates()).to.eql([outer]);
      expect(p2.getCoordinates()).to.eql([outer, inner1]);
      expect(p3.getCoordinates()).to.eql([outer, inner2]);
    });

  });

  describe('#rings', function() {

    it('is an array of LinearRing', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);

      expect(poly.rings.length).to.be(3);
      expect(poly.rings[0]).to.be.a(ol.geom.LinearRing);
      expect(poly.rings[1]).to.be.a(ol.geom.LinearRing);
      expect(poly.rings[2]).to.be.a(ol.geom.LinearRing);
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly.dimension).to.be(2);
    });

    it('can be 3', function() {
      var poly = new ol.geom.Polygon([[[10, 20, 30], [40, 50, 60]]]);
      expect(poly.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var bounds = poly.getBounds();
      expect(bounds[0]).to.be(0);
      expect(bounds[1]).to.be(10);
      expect(bounds[2]).to.be(0);
      expect(bounds[3]).to.be(10);
    });

  });

  describe('#getCoordinates()', function() {

    it('returns an array', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly.getCoordinates()).to.eql([outer, inner1, inner2]);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
