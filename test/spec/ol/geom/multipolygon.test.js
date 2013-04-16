goog.provide('ol.test.geom.MultiPolygon');

describe('ol.geom.MultiPolygon', function() {

  var outer1 = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      inner1a = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner1b = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]],
      outer2 = [[10, 10], [20, 0], [20, 50], [10, 50], [10, 10]];

  describe('constructor', function() {

    it('creates a multi-linestring from an array', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);
      expect(multi).to.be.a(ol.geom.MultiPolygon);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

    it('throws when given with insufficient dimensions', function() {
      expect(function() {
        var multi = new ol.geom.MultiPolygon([1]);
      }).to.throwException();
    });

  });

  describe('#components', function() {

    it('is an array of polygons', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);

      expect(multi.components.length).to.be(2);
      expect(multi.components[0]).to.be.a(ol.geom.Polygon);
      expect(multi.components[1]).to.be.a(ol.geom.Polygon);

    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);
      expect(multi.dimension).to.be(2);
    });

    it('can be 3', function() {
      var multi = new ol.geom.MultiPolygon([[[[10, 20, 30], [40, 50, 60]]]]);
      expect(multi.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);
      var bounds = multi.getBounds();
      expect(bounds[0]).to.be(0);
      expect(bounds[1]).to.be(20);
      expect(bounds[2]).to.be(0);
      expect(bounds[3]).to.be(50);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var coordinates = [
        [outer1, inner1a, inner1b],
        [outer2]
      ];
      var multi = new ol.geom.MultiPolygon(coordinates);
      expect(multi.getCoordinates()).to.eql(coordinates);
    });

  });


});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
