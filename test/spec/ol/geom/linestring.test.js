goog.provide('ol.test.geom.LineString');

describe('ol.geom.LineString', function() {

  describe('constructor', function() {

    it('creates a linestring from an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line).to.be.a(ol.geom.LineString);
      expect(line).to.be.a(ol.geom.Geometry);
    });

    it('throws when given mismatched dimension', function() {
      expect(function() {
        var line = new ol.geom.LineString([[10, 20], [30, 40, 50]]);
      }).to.throwException();
    });

    it('accepts shared vertices', function() {
      var vertices = new ol.geom.SharedVertices();
      var l1 = new ol.geom.LineString([[10, 20], [30, 40]], vertices);
      var l2 = new ol.geom.LineString([[50, 60], [70, 80]], vertices);
      expect(l1.getCoordinates()).to.eql([[10, 20], [30, 40]]);
      expect(l2.getCoordinates()).to.eql([[50, 60], [70, 80]]);
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
      expect(bounds[1]).to.be(30);
      expect(bounds[2]).to.be(20);
      expect(bounds[3]).to.be(40);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.getCoordinates()).to.eql([[10, 20], [30, 40]]);
    });

  });

  describe('#getSharedId()', function() {

    it('returns identifiers', function() {
      var vertices = new ol.geom.SharedVertices();

      var l1 = new ol.geom.LineString([[10, 20], [30, 40]], vertices);
      var l2 = new ol.geom.LineString(
          [[50, 60], [70, 80], [90, 100]], vertices);

      var id1 = l1.getSharedId();
      var id2 = l2.getSharedId();

      expect(vertices.coordinates).to.eql(
          [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

      expect(vertices.getStart(id1)).to.be(0);
      expect(vertices.getCount(id1)).to.be(2);
      expect(vertices.get(id1, 0, 0)).to.be(10);
      expect(vertices.get(id1, 0, 1)).to.be(20);
      expect(vertices.get(id1, 1, 0)).to.be(30);
      expect(vertices.get(id1, 1, 1)).to.be(40);

      expect(vertices.getStart(id2)).to.be(4);
      expect(vertices.getCount(id2)).to.be(3);
      expect(vertices.get(id2, 0, 0)).to.be(50);
      expect(vertices.get(id2, 0, 1)).to.be(60);
      expect(vertices.get(id2, 1, 0)).to.be(70);
      expect(vertices.get(id2, 1, 1)).to.be(80);
      expect(vertices.get(id2, 2, 0)).to.be(90);
      expect(vertices.get(id2, 2, 1)).to.be(100);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SharedVertices');
