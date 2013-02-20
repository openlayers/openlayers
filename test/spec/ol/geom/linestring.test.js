goog.provide('ol.test.geom.LineString');

describe('ol.geom.LineString', function() {

  describe('constructor', function() {

    it('creates a linestring from an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line).toBeA(ol.geom.LineString);
      expect(line).toBeA(ol.geom.Geometry);
    });

    it('throws when given mismatched dimension', function() {
      expect(function() {
        var line = new ol.geom.LineString([[10, 20], [30, 40, 50]]);
      }).toThrow();
    });

  });

  describe('#coordinates', function() {

    it('is a Float64Array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.coordinates).toBeA(Float64Array);

      expect(line.coordinates.length).toBe(4);
      expect(line.coordinates[0]).toBe(10);
      expect(line.coordinates[1]).toBe(20);
      expect(line.coordinates[2]).toBe(30);
      expect(line.coordinates[3]).toBe(40);
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.dimension).toBe(2);
    });

    it('can be 3', function() {
      var line = new ol.geom.LineString([[10, 20, 30], [40, 50, 60]]);
      expect(line.dimension).toBe(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var line = new ol.geom.LineString([[10, 20], [20, 30], [30, 40]]);
      var bounds = line.getBounds();
      expect(bounds.minX).toBe(10);
      expect(bounds.minY).toBe(20);
      expect(bounds.maxX).toBe(30);
      expect(bounds.maxY).toBe(40);
    });

  });


});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
