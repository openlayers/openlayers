goog.provide('ol.test.filter.Geometry');


describe('ol.filter.Geometry', function() {

  describe('constructor', function() {
    it('creates a new filter', function() {
      var filter = new ol.filter.Geometry(ol.filter.GeometryType.POINT);
      expect(filter).toBeA(ol.filter.Geometry);
    });
  });

  describe('#getType()', function() {

    it('works for point', function() {
      var filter = new ol.filter.Geometry(ol.filter.GeometryType.POINT);
      expect(filter.getType()).toBe(ol.filter.GeometryType.POINT);
    });

    it('works for linestring', function() {
      var filter = new ol.filter.Geometry(ol.filter.GeometryType.LINESTRING);
      expect(filter.getType()).toBe(ol.filter.GeometryType.LINESTRING);
    });

    it('works for polygon', function() {
      var filter = new ol.filter.Geometry(ol.filter.GeometryType.POLYGON);
      expect(filter.getType()).toBe(ol.filter.GeometryType.POLYGON);
    });

    it('works for multi-point', function() {
      var filter = new ol.filter.Geometry(ol.filter.GeometryType.MULTIPOINT);
      expect(filter.getType()).toBe(ol.filter.GeometryType.MULTIPOINT);
    });

    it('works for multi-linestring', function() {
      var filter = new ol.filter.Geometry(
            ol.filter.GeometryType.MULTILINESTRING);
      expect(filter.getType()).toBe(ol.filter.GeometryType.MULTILINESTRING);
    });

    it('works for multi-polygon', function() {
      var filter = new ol.filter.Geometry(ol.filter.GeometryType.MULTIPOLYGON);
      expect(filter.getType()).toBe(ol.filter.GeometryType.MULTIPOLYGON);
    });

  });

});

goog.require('ol.filter.Geometry');
goog.require('ol.filter.GeometryType');
