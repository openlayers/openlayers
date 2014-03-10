goog.provide('ol.test.geom.MultiPolygon');


describe('ol.geom.MultiPolygon', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var multiPolygon = new ol.geom.MultiPolygon(null);
      multiPolygon = multiPolygon; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('with a simple MultiPolygon', function() {

    var multiPolygon;
    beforeEach(function() {
      multiPolygon = new ol.geom.MultiPolygon([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
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
