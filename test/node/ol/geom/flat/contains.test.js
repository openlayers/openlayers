import expect from '../../../expect.js';
import {linearRingContainsXY} from '../../../../../src/ol/geom/flat/contains.js';

describe('ol/geom/flat/contains.js', function () {
  describe('with simple data', function () {
    const flatCoordinatesSimple = [0, 0, 1, 0, 1, 1, 0, 1];
    const flatCoordinatesNonSimple = [
      0, 0, 4, 0, 4, 3, 1, 3, 1, 2, 3, 2, 3, 1, 2, 1, 2, 4, 0, 4,
    ];

    describe('linearRingContainsXY', function () {
      it('returns true for point inside a simple polygon', function () {
        expect(
          linearRingContainsXY(
            flatCoordinatesSimple,
            0,
            flatCoordinatesSimple.length,
            2,
            0.5,
            0.5
          )
        ).to.be(true);
      });

      it('returns false for point outside a simple polygon', function () {
        expect(
          linearRingContainsXY(
            flatCoordinatesSimple,
            0,
            flatCoordinatesSimple.length,
            2,
            1.5,
            1.5
          )
        ).to.be(false);
      });

      it('returns true for point inside a non-simple polygon', function () {
        expect(
          linearRingContainsXY(
            flatCoordinatesNonSimple,
            0,
            flatCoordinatesNonSimple.length,
            2,
            1,
            1
          )
        ).to.be(true);
      });

      it('returns true for point inside an overlap of a non-simple polygon', function () {
        expect(
          linearRingContainsXY(
            flatCoordinatesNonSimple,
            0,
            flatCoordinatesNonSimple.length,
            2,
            1.5,
            2.5
          )
        ).to.be(true);
      });

      it('returns false for a point inside a hole of a non-simple polygon', function () {
        expect(
          linearRingContainsXY(
            flatCoordinatesNonSimple,
            0,
            flatCoordinatesNonSimple.length,
            2,
            2.5,
            1.5
          )
        ).to.be(false);
      });
    });
  });
});
