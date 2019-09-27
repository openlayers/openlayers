import {assert} from 'chai';
import {
  inflateCoordinates,
  inflateCoordinatesArray,
} from '../../../../../src/ol/geom/flat/inflate.js';

describe('ol/geom/flat/inflate.js', function () {
  describe('inflateCoordinates', function () {
    it('inflates coordinates', function () {
      const coordinates = inflateCoordinates([1, 2, 3, 4], 0, 4, 2);
      assert.deepEqual(coordinates, [
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('inflateCoordinatesArray', function () {
    it('inflates arrays of coordinates', function () {
      const coordinatess = inflateCoordinatesArray(
        [1, 2, 3, 4, 5, 6, 7, 8],
        0,
        [4, 8],
        2,
      );
      assert.deepEqual(coordinatess, [
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]);
    });
  });
});
