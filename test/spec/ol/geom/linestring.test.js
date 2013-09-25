goog.provide('ol.test.geom.LineString');

describe('ol.geom.LineString', function() {

  describe('constructor', function() {

    it('creates a linestring from an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line).to.be.a(ol.geom.LineString);
      expect(line).to.be.a(ol.geom.Geometry);
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.dimension).to.be(2);
    });

    it('can be 3', function() {
      var line = new ol.geom.LineString([[10, 20, 30], [40, 50, 60]]);
      expect(line.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var line = new ol.geom.LineString([[10, 20], [20, 30], [30, 40]]);
      var bounds = line.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[2]).to.be(30);
      expect(bounds[1]).to.be(20);
      expect(bounds[3]).to.be(40);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.getCoordinates()).to.eql([[10, 20], [30, 40]]);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
