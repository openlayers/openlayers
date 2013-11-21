goog.provide('ol.test.geom.Polygon');

describe('ol.geom.Polygon', function() {

  var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];

  describe('constructor', function() {

    it('creates a polygon from an array', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly).to.be.a(ol.geom.Polygon);
      expect(poly).to.be.a(ol.geom.Geometry);
    });

  });

  describe('#getRings()', function() {

    it('returns an array of LinearRing', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var rings = poly.getRings();
      expect(rings.length).to.be(3);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
    });

    var isClockwise = ol.geom.LinearRing.isClockwise;

    it('forces exterior ring to be clockwise', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      expect(isClockwise(outer)).to.be(false);

      var poly = new ol.geom.Polygon([outer]);
      var ring = poly.getRings()[0];
      expect(isClockwise(ring.getCoordinates())).to.be(true);
    });

    it('forces interior ring to be counter-clockwise', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      var inner = [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]];
      expect(isClockwise(inner)).to.be(true);

      var poly = new ol.geom.Polygon([outer, inner]);
      var ring = poly.getRings()[1];
      expect(isClockwise(ring.getCoordinates())).to.be(false);
    });


  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var bounds = poly.getBounds();
      expect(bounds[0]).to.be(0);
      expect(bounds[2]).to.be(10);
      expect(bounds[1]).to.be(0);
      expect(bounds[3]).to.be(10);
    });

  });

  describe('#getCoordinates()', function() {

    it('returns an array', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly.getCoordinates()).to.eql([outer, inner1, inner2]);
    });

  });

  describe('#transform()', function() {

    var forward = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
    var inverse = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

    var gg, sm;
    beforeEach(function() {
      gg = [
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
        [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
        [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]]
      ];

      sm = [[
        [0, 0], [0, 1118890], [1113195, 1118890], [1113195, 0], [0, 0]
      ], [
        [111319, 111325], [222639, 111325], [222639, 222684],
        [111319, 222684], [111319, 111325]
      ], [
        [890556, 893464], [1001875, 893464], [1001875, 1006021],
        [890556, 1006021], [890556, 893464]
      ]];

    });

    it('forward transforms a polygon in place', function() {

      var poly = new ol.geom.Polygon(gg);
      poly.transform(forward);
      var coordinates = poly.getCoordinates();
      var ring;
      for (var i = 0, ii = coordinates.length; i < ii; ++i) {
        var ring = coordinates[i];
        for (var j = 0, jj = ring.length; j < jj; ++j) {
          expect(ring[j][0]).to.roughlyEqual(sm[i][j][0], 1);
          expect(ring[j][1]).to.roughlyEqual(sm[i][j][1], 1);
        }
      }

    });

    it('inverse transforms a polygon in place', function() {

      var poly = new ol.geom.Polygon(sm);
      poly.transform(inverse);
      var coordinates = poly.getCoordinates();
      var ring;
      for (var i = 0, ii = coordinates.length; i < ii; ++i) {
        var ring = coordinates[i];
        for (var j = 0, jj = ring.length; j < jj; ++j) {
          expect(ring[j][0]).to.roughlyEqual(gg[i][j][0], 0.001);
          expect(ring[j][1]).to.roughlyEqual(gg[i][j][1], 0.001);
        }
      }

    });

  });

  describe('change event', function() {

    var outer, inner;
    beforeEach(function() {
      outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      inner = [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]];
    });

    it('is fired when outer ring is modified', function(done) {
      var poly = new ol.geom.Polygon([outer, inner]);
      var rings = poly.getRings();
      var bounds = poly.getBounds();
      goog.events.listen(poly, 'change', function(evt) {
        expect(evt.target).to.be(poly);
        expect(evt.oldExtent).to.eql(bounds);
        expect(evt.target.getBounds()).to.eql([0, 0, 11, 10]);
        done();
      });

      var outerCoords = rings[0].getCoordinates();
      outerCoords[1][0] = 11;
      rings[0].setCoordinates(outerCoords);
    });

    it('is fired when inner ring is modified', function(done) {
      var poly = new ol.geom.Polygon([outer, inner]);
      var rings = poly.getRings();
      var bounds = poly.getBounds();
      goog.events.listen(poly, 'change', function(evt) {
        expect(evt.target).to.be(poly);
        expect(evt.oldExtent).to.eql(bounds);
        expect(evt.target.getBounds()).to.eql([0, 0, 10, 10]);
        done();
      });

      var innerCoords = rings[1].getCoordinates();
      innerCoords[1][0] = 3;
      rings[1].setCoordinates(innerCoords);
    });

  });

});

goog.require('goog.events');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
