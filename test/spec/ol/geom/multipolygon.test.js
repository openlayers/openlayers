goog.provide('ol.test.geom.MultiPolygon');

describe('ol.geom.MultiPolygon', function() {

  var outer1 = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      inner1a = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner1b = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]],
      outer2 = [[10, 10], [20, 0], [20, 50], [10, 50], [10, 10]];

  describe('constructor', function() {

    it('creates a multi-linestring from an array', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);
      expect(multi).to.be.a(ol.geom.MultiPolygon);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

    it('throws when given with insufficient dimensions', function() {
      expect(function() {
        var multi = new ol.geom.MultiPolygon([1]);
        multi = multi; // suppress gjslint warning about unused variable
      }).to.throwException();
    });

  });

  describe('#components', function() {

    it('is an array of polygons', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);

      var components = multi.getComponents();
      expect(components.length).to.be(2);
      expect(components[0]).to.be.a(ol.geom.Polygon);
      expect(components[1]).to.be.a(ol.geom.Polygon);

    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var multi = new ol.geom.MultiPolygon([
        [outer1, inner1a, inner1b],
        [outer2]]);
      var bounds = multi.getBounds();
      expect(bounds[0]).to.be(0);
      expect(bounds[2]).to.be(20);
      expect(bounds[1]).to.be(0);
      expect(bounds[3]).to.be(50);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var coordinates = [
        [outer1, inner1a, inner1b],
        [outer2]
      ];
      var multi = new ol.geom.MultiPolygon(coordinates);
      expect(multi.getCoordinates()).to.eql(coordinates);
    });

  });

  describe('change event', function() {

    var outer, inner;
    beforeEach(function() {
      outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      inner = [[2, 2], [2, 8], [8, 8], [8, 2], [2, 2]];
    });

    it('is fired when outer ring is modified', function(done) {
      var multi = new ol.geom.MultiPolygon([[outer, inner], [outer, inner]]);
      var components = multi.getComponents();
      var bounds = multi.getBounds();
      goog.events.listen(multi, 'change', function(evt) {
        expect(evt.target).to.be(multi);
        expect(evt.oldExtent).to.eql(bounds);
        expect(evt.target.getBounds()).to.eql([0, 0, 11, 10]);
        done();
      });

      var outerOne = components[0].getRings()[0];
      var outerCoords = outerOne.getCoordinates();
      outerCoords[1][0] = 11;
      outerOne.setCoordinates(outerCoords);
    });

    it('is fired when inner ring is modified', function(done) {
      var multi = new ol.geom.MultiPolygon([[outer, inner], [outer, inner]]);
      var components = multi.getComponents();
      var bounds = multi.getBounds();
      goog.events.listen(multi, 'change', function(evt) {
        expect(evt.target).to.be(multi);
        expect(evt.oldExtent).to.eql(bounds);
        expect(evt.target.getBounds()).to.eql([0, 0, 10, 10]);
        done();
      });

      var innerTwo = components[1].getRings()[1];
      var innerCoords = innerTwo.getCoordinates();
      innerCoords[1][0] = 3;
      innerTwo.setCoordinates(innerCoords);
    });

  });

});

goog.require('goog.events');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
