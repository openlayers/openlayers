goog.provide('ol.test.geom.Geometry');

describe('ol.geom.Geometry', function() {

  describe('constructor', function() {
    it('creates a new geometry', function() {
      var geom = new ol.geom.Geometry();
      expect(geom).to.be.a(ol.geom.Geometry);
      expect(geom).to.be.a(ol.Observable);
    });
  });

  describe('#clone()', function() {
    it('clones a geometry', function() {
      var line = new ol.geom.LineString([[0, 0], [1, 1]]);
      var clone = line.clone();
      expect(clone.getCoordinates().length).to.be(2);
      expect(clone.getCoordinates()[0]).to.eql(line.getCoordinates()[0]);
      expect(clone.getCoordinates()[0]).to.not.be(line.getCoordinates()[0]);
      var coordinates = clone.getCoordinates();
      coordinates[0] = [2, 2];
      clone.setCoordinates(coordinates);
      expect(clone.getCoordinates()[0]).to.not.eql(line.getCoordinates()[0]);
    });
  });

});

goog.require('ol.Observable');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
