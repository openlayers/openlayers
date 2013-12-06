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
