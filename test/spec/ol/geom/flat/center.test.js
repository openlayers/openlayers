goog.provide('ol.test.geom.flat.center');

goog.require('ol.geom.flat.center');
goog.require('ol.geom.MultiPolygon');


describe('ol.geom.flat.center', function() {

  describe('ol.geom.flat.center.linearRingss', function() {

    it('calculates the center of a square', function() {
      var squareMultiPoly = new ol.geom.MultiPolygon([[
        [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
      ]]);
      var got = ol.geom.flat.center.linearRingss(
        squareMultiPoly.flatCoordinates,
        0,
        squareMultiPoly.endss_,
        2
      );
      expect(got).to.eql([0.5, 0.5]);
    });

    it('calculates the centers of two squares', function() {
      var squareMultiPoly = new ol.geom.MultiPolygon([
        [
          [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
        ],
        [
          [[3, 0], [3, 1], [4, 1], [4, 0], [3, 0]]
        ]
      ]);
      var got = ol.geom.flat.center.linearRingss(
        squareMultiPoly.flatCoordinates,
        0,
        squareMultiPoly.endss_,
        2
      );
      expect(got).to.eql([0.5, 0.5, 3.5, 0.5]);
    });

    it('does not care about holes', function() {
      var polywithHole = new ol.geom.MultiPolygon([[
          [[0, 0], [0, 5], [5, 5], [5, 0], [0, 0]],
          [[1, 1], [1, 4], [4, 4], [4, 1], [1, 1]]
      ]]);
      var got = ol.geom.flat.center.linearRingss(
        polywithHole.flatCoordinates,
        0,
        polywithHole.endss_,
        2
      );
      expect(got).to.eql([2.5, 2.5]);
    });

  });

});
