import {assert} from 'chai';
import {
  deflateCoordinates,
  deflateCoordinatesArray,
} from '../../../../../src/ol/geom/flat/deflate.js';

describe('ol/geom/flat/deflate.js', function () {
  describe('deflateCoordinates', function () {
    let flatCoordinates;
    beforeEach(function () {
      flatCoordinates = [];
    });

    it('flattens coordinates', function () {
      const offset = deflateCoordinates(
        flatCoordinates,
        0,
        [
          [1, 2],
          [3, 4],
        ],
        2,
      );
      assert.strictEqual(offset, 4);
      assert.deepEqual(flatCoordinates, [1, 2, 3, 4]);
    });
  });

  describe('deflateCoordinatesArray', function () {
    let flatCoordinates;
    beforeEach(function () {
      flatCoordinates = [];
    });

    it('flattens arrays of coordinates', function () {
      const ends = deflateCoordinatesArray(
        flatCoordinates,
        0,
        [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ],
        2,
      );
      assert.deepEqual(ends, [4, 8]);
      assert.deepEqual(flatCoordinates, [1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
});
