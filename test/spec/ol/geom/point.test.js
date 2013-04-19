goog.provide('ol.test.geom.Point');

describe('ol.geom.Point', function() {

  describe('constructor', function() {

    it('creates a point from an array', function() {
      var point = new ol.geom.Point([10, 20]);
      expect(point).to.be.a(ol.geom.Point);
      expect(point).to.be.a(ol.geom.Geometry);
    });

    it('accepts shared vertices', function() {
      var vertices = new ol.geom.SharedVertices();
      var p1 = new ol.geom.Point([10, 20], vertices);
      var p2 = new ol.geom.Point([30, 40], vertices);
      var p3 = new ol.geom.Point([50, 60], vertices);
      expect(p1.getCoordinates()).to.eql([10, 20]);
      expect(p2.getCoordinates()).to.eql([30, 40]);
      expect(p3.getCoordinates()).to.eql([50, 60]);
    });

    it('throws when given with insufficient dimensions', function() {
      expect(function() {
        var point = new ol.geom.Point([1]);
      }).to.throwException();
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var point = new ol.geom.Point([10, 20]);
      expect(point.dimension).to.be(2);
    });

    it('can be 3', function() {
      var point = new ol.geom.Point([10, 20, 30]);
      expect(point.dimension).to.be(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var point = new ol.geom.Point([10, 20]);
      var bounds = point.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[1]).to.be(10);
      expect(bounds[2]).to.be(20);
      expect(bounds[3]).to.be(20);
    });

  });

  describe('#getCoordinates()', function() {

    it('returns an array', function() {
      var point = new ol.geom.Point([10, 20]);
      expect(point.getCoordinates()).to.eql([10, 20]);
    });

  });


  describe('#getSharedId()', function() {

    it('returns identifiers', function() {
      var vertices = new ol.geom.SharedVertices();

      var p1 = new ol.geom.Point([10, 20], vertices);
      var p2 = new ol.geom.Point([30, 40], vertices);
      var p3 = new ol.geom.Point([50, 60], vertices);

      var id1 = p1.getSharedId();
      var id2 = p2.getSharedId();
      var id3 = p3.getSharedId();

      expect(vertices.coordinates).to.eql(
          [10, 20, 30, 40, 50, 60]);

      expect(vertices.getStart(id1)).to.be(0);
      expect(vertices.getCount(id1)).to.be(1);
      expect(vertices.get(id1, 0, 0)).to.be(10);
      expect(vertices.get(id1, 0, 1)).to.be(20);

      expect(vertices.getStart(id2)).to.be(2);
      expect(vertices.getCount(id2)).to.be(1);
      expect(vertices.get(id2, 0, 0)).to.be(30);
      expect(vertices.get(id2, 0, 1)).to.be(40);

      expect(vertices.getStart(id3)).to.be(4);
      expect(vertices.getCount(id3)).to.be(1);
      expect(vertices.get(id3, 0, 0)).to.be(50);
      expect(vertices.get(id3, 0, 1)).to.be(60);
    });

  });

});

goog.require('ol.geom.Geometry');
goog.require('ol.geom.Point');
goog.require('ol.geom.SharedVertices');
