import _ol_geom_flat_center_ from '../../../../../src/ol/geom/flat/center.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';


describe('ol.geom.flat.center', function() {

  describe('ol.geom.flat.center.linearRingss', function() {

    it('calculates the center of a square', function() {
      var squareMultiPoly = new MultiPolygon([[
        [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
      ]]);
      var got = _ol_geom_flat_center_.linearRingss(
          squareMultiPoly.flatCoordinates,
          0,
          squareMultiPoly.endss_,
          2
      );
      expect(got).to.eql([0.5, 0.5]);
    });

    it('calculates the centers of two squares', function() {
      var squareMultiPoly = new MultiPolygon([
        [
          [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
        ],
        [
          [[3, 0], [3, 1], [4, 1], [4, 0], [3, 0]]
        ]
      ]);
      var got = _ol_geom_flat_center_.linearRingss(
          squareMultiPoly.flatCoordinates,
          0,
          squareMultiPoly.endss_,
          2
      );
      expect(got).to.eql([0.5, 0.5, 3.5, 0.5]);
    });

    it('does not care about holes', function() {
      var polywithHole = new MultiPolygon([[
        [[0, 0], [0, 5], [5, 5], [5, 0], [0, 0]],
        [[1, 1], [1, 4], [4, 4], [4, 1], [1, 1]]
      ]]);
      var got = _ol_geom_flat_center_.linearRingss(
          polywithHole.flatCoordinates,
          0,
          polywithHole.endss_,
          2
      );
      expect(got).to.eql([2.5, 2.5]);
    });

  });

});
