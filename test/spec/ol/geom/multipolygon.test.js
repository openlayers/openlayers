goog.provide('ol.test.geom.MultiPolygon');


describe('ol.geom.MultiPolygon', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var multiPolygon = new ol.geom.MultiPolygon(null);
      multiPolygon = multiPolygon; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('with a null MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new ol.geom.MultiPolygon(null);
    });

    it('can append polygons', function() {
      multiPolygon.appendPolygon(
          new ol.geom.Polygon([[[0, 0], [0, 2], [1, 1], [2, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql(
          [[[[0, 0], [0, 2], [1, 1], [2, 0]]]]);
      multiPolygon.appendPolygon(
          new ol.geom.Polygon([[[3, 0], [4, 1], [5, 2], [5, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
      expect(multiPolygon.getPolygons().length).to.eql(2);
    });

  });

  describe('with an empty MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new ol.geom.MultiPolygon([]);
    });

    it('can append polygons', function() {
      multiPolygon.appendPolygon(
          new ol.geom.Polygon([[[0, 0], [0, 2], [1, 1], [2, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql(
          [[[[0, 0], [0, 2], [1, 1], [2, 0]]]]);
      multiPolygon.appendPolygon(
          new ol.geom.Polygon([[[3, 0], [4, 1], [5, 2], [5, 0]]]));
      expect(multiPolygon.getCoordinates()).to.eql([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
      expect(multiPolygon.getPolygons().length).to.eql(2);
    });

  });

  describe('with a simple MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new ol.geom.MultiPolygon([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
    });

    it('can return individual polygons', function() {
      var polygon0 = multiPolygon.getPolygon(0);
      expect(polygon0).to.be.an(ol.geom.Polygon);
      expect(polygon0.getCoordinates()).to.eql(
          [[[0, 0], [0, 2], [1, 1], [2, 0]]]);
      var polygon1 = multiPolygon.getPolygon(1);
      expect(polygon1).to.be.an(ol.geom.Polygon);
      expect(polygon1.getCoordinates()).to.eql(
          [[[3, 0], [4, 1], [5, 2], [5, 0]]]);
    });

    it('can return all polygons', function() {
      var polygons = multiPolygon.getPolygons();
      expect(polygons).to.be.an(Array);
      expect(polygons).to.have.length(2);
      expect(polygons[0]).to.be.an(ol.geom.Polygon);
      expect(polygons[0].getCoordinates()).to.eql(
          [[[0, 0], [0, 2], [1, 1], [2, 0]]]);
      expect(polygons[1]).to.be.an(ol.geom.Polygon);
      expect(polygons[1].getCoordinates()).to.eql(
          [[[3, 0], [4, 1], [5, 2], [5, 0]]]);
    });

    describe('#getSimplifiedGeometry', function() {

      it('returns the expected result', function() {
        var simplifiedGeometry = multiPolygon.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).to.be.an(ol.geom.MultiPolygon);
        expect(simplifiedGeometry.getCoordinates()).to.eql([
          [[[0, 0], [0, 2], [2, 0]]],
          [[[3, 0], [5, 2], [5, 0]]]
        ]);
      });
    });

  });

});


goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
