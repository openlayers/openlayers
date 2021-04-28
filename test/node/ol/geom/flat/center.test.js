import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import expect from '../../../expect.js';
import {linearRingss as linearRingssCenter} from '../../../../../src/ol/geom/flat/center.js';

describe('ol/geom/flat/center.js', function () {
  describe('linearRingss', function () {
    it('calculates the center of a square', function () {
      const squareMultiPoly = new MultiPolygon([
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      ]);
      const got = linearRingssCenter(
        squareMultiPoly.flatCoordinates,
        0,
        squareMultiPoly.endss_,
        2
      );
      expect(got).to.eql([0.5, 0.5]);
    });

    it('calculates the centers of two squares', function () {
      const squareMultiPoly = new MultiPolygon([
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
        [
          [
            [3, 0],
            [3, 1],
            [4, 1],
            [4, 0],
            [3, 0],
          ],
        ],
      ]);
      const got = linearRingssCenter(
        squareMultiPoly.flatCoordinates,
        0,
        squareMultiPoly.endss_,
        2
      );
      expect(got).to.eql([0.5, 0.5, 3.5, 0.5]);
    });

    it('does not care about holes', function () {
      const polywithHole = new MultiPolygon([
        [
          [
            [0, 0],
            [0, 5],
            [5, 5],
            [5, 0],
            [0, 0],
          ],
          [
            [1, 1],
            [1, 4],
            [4, 4],
            [4, 1],
            [1, 1],
          ],
        ],
      ]);
      const got = linearRingssCenter(
        polywithHole.flatCoordinates,
        0,
        polywithHole.endss_,
        2
      );
      expect(got).to.eql([2.5, 2.5]);
    });
  });
});
