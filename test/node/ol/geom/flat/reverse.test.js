import {assert} from 'chai';
import {coordinates as reverseCoordinates} from '../../../../../src/ol/geom/flat/reverse.js';

describe('ol/geom/flat/reverse.js', function () {
  describe('coordinates', function () {
    describe('with a stride of 2', function () {
      it('can reverse empty flat coordinates', function () {
        const flatCoordinates = [];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        assert.isEmpty(flatCoordinates);
      });

      it('can reverse one flat coordinates', function () {
        const flatCoordinates = [1, 2];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        assert.deepEqual(flatCoordinates, [1, 2]);
      });

      it('can reverse two flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        assert.deepEqual(flatCoordinates, [3, 4, 1, 2]);
      });

      it('can reverse three flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        assert.deepEqual(flatCoordinates, [5, 6, 3, 4, 1, 2]);
      });

      it('can reverse four flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        assert.deepEqual(flatCoordinates, [7, 8, 5, 6, 3, 4, 1, 2]);
      });
    });

    describe('with a stride of 3', function () {
      it('can reverse empty flat coordinates', function () {
        const flatCoordinates = [];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        assert.isEmpty(flatCoordinates);
      });

      it('can reverse one flat coordinates', function () {
        const flatCoordinates = [1, 2, 3];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        assert.deepEqual(flatCoordinates, [1, 2, 3]);
      });

      it('can reverse two flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        assert.deepEqual(flatCoordinates, [4, 5, 6, 1, 2, 3]);
      });

      it('can reverse three flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        assert.deepEqual(flatCoordinates, [7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

      it('can reverse four flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        assert.deepEqual(
          flatCoordinates,
          [10, 11, 12, 7, 8, 9, 4, 5, 6, 1, 2, 3],
        );
      });
    });

    describe('with a stride of 4', function () {
      it('can reverse empty flat coordinates', function () {
        const flatCoordinates = [];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        assert.isEmpty(flatCoordinates);
      });

      it('can reverse one flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        assert.deepEqual(flatCoordinates, [1, 2, 3, 4]);
      });

      it('can reverse two flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        assert.deepEqual(flatCoordinates, [5, 6, 7, 8, 1, 2, 3, 4]);
      });

      it('can reverse three flat coordinates', function () {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        assert.deepEqual(
          flatCoordinates,
          [9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4],
        );
      });

      it('can reverse four flat coordinates', function () {
        const flatCoordinates = [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
        ];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        assert.deepEqual(
          flatCoordinates,
          [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4],
        );
      });
    });
  });
});
