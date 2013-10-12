goog.provide('ol.test.geom.MultiLineString');

describe('ol.geom.MultiLineString', function() {

  describe('constructor', function() {

    it('creates a multi-linestring from an array', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);
      expect(multi).to.be.a(ol.geom.MultiLineString);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

  });

  describe('#components', function() {

    it('is an array of linestrings', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);

      var components = multi.getComponents();
      expect(components.length).to.be(2);
      expect(components[0]).to.be.a(ol.geom.LineString);
      expect(components[1]).to.be.a(ol.geom.LineString);

    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var multi = new ol.geom.MultiLineString([
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]]);
      var bounds = multi.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[2]).to.be(40);
      expect(bounds[1]).to.be(20);
      expect(bounds[3]).to.be(50);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var coordinates = [
        [[10, 20], [30, 40]],
        [[20, 30], [40, 50]]
      ];
      var multi = new ol.geom.MultiLineString(coordinates);
      expect(multi.getCoordinates()).to.eql(coordinates);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
