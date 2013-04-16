goog.provide('ol.test.geom.GeometryCollection');

describe('ol.geom.GeometryCollection', function() {

  var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];

  describe('constructor', function() {


    it('creates a geometry collection from an array of geometries', function() {
      var point = new ol.geom.Point([10, 20]);
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var multi = new ol.geom.GeometryCollection([point, line, poly]);
      expect(multi).to.be.a(ol.geom.GeometryCollection);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

  });

  describe('#components', function() {

    it('is an array of geometries', function() {
      var point = new ol.geom.Point([10, 20]);
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var multi = new ol.geom.GeometryCollection([point, line, poly]);

      expect(multi.components.length).to.be(3);
      expect(multi.components[0]).to.be.a(ol.geom.Point);
      expect(multi.components[1]).to.be.a(ol.geom.LineString);
      expect(multi.components[2]).to.be.a(ol.geom.Polygon);
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var point = new ol.geom.Point([10, 20]);
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var multi = new ol.geom.GeometryCollection([point, line, poly]);
      expect(multi.dimension).to.be(2);
    });

    it('can be 3', function() {
      var multi = new ol.geom.GeometryCollection([
        new ol.geom.Point([30, 40, 50])
      ]);
      expect(multi.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var point = new ol.geom.Point([10, 2]);
      var line = new ol.geom.LineString([[1, 20], [30, 40]]);
      var multi = new ol.geom.GeometryCollection([point, line]);
      var bounds = multi.getBounds();
      expect(bounds[0]).to.be(1);
      expect(bounds[1]).to.be(30);
      expect(bounds[2]).to.be(2);
      expect(bounds[3]).to.be(40);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
