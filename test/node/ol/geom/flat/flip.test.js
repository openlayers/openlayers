import {assert} from 'chai';
import {flipXY} from '../../../../../src/ol/geom/flat/flip.js';

describe('ol/geom/flat/flip.js', function () {
  describe('flipXY', function () {
    it('can flip XY coordinates', function () {
      const flatCoordinates = flipXY([1, 2, 3, 4], 0, 4, 2);
      assert.deepEqual(flatCoordinates, [2, 1, 4, 3]);
    });

    it('can flip XY coordinates while preserving other dimensions', function () {
      const flatCoordinates = flipXY([1, 2, 3, 4, 5, 6, 7, 8], 0, 8, 4);
      assert.deepEqual(flatCoordinates, [2, 1, 3, 4, 6, 5, 7, 8]);
    });

    it('can flip XY coordinates in place', function () {
      const flatCoordinates = [1, 2, 3, 4];
      assert.strictEqual(
        flipXY(flatCoordinates, 0, 4, 2, flatCoordinates),
        flatCoordinates,
      );
      assert.deepEqual(flatCoordinates, [2, 1, 4, 3]);
    });

    it('can flip XY coordinates in place while preserving other dimensions', function () {
      const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      assert.strictEqual(
        flipXY(flatCoordinates, 0, 9, 3, flatCoordinates),
        flatCoordinates,
      );
      assert.deepEqual(flatCoordinates, [2, 1, 3, 5, 4, 6, 8, 7, 9]);
    });
  });
});
