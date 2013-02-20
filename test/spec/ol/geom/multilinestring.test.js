goog.provide('ol.test.geom.MultiLineString');

describe('ol.geom.MultiLineString', function() {

  describe('constructor', function() {

    it('creates a multi-linestring from an array', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);
      expect(multi).toBeA(ol.geom.MultiLineString);
    });

    it('throws when given with insufficient dimensions', function() {
      expect(function() {
        var multi = new ol.geom.MultiPoint([1]);
      }).toThrow();
    });

  });

  describe('#components', function() {

    it('is an array of linestrings', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);

      expect(multi.components.length).toBe(2);
      expect(multi.components[0]).toBeA(ol.geom.LineString);
      expect(multi.components[1]).toBeA(ol.geom.LineString);

    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);
      expect(multi.dimension).toBe(2);
    });

    it('can be 3', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20, 30], [30, 40, 50]],
        [[20, 30, 40], [40, 50, 60]]]);
      expect(multi.dimension).toBe(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);
      var bounds = multi.getBounds();
      expect(bounds.minX).toBe(10);
      expect(bounds.minY).toBe(20);
      expect(bounds.maxX).toBe(40);
      expect(bounds.maxY).toBe(50);
    });

  });

});

goog.require('ol.geom.MultiLineString');
