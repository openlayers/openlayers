import {coordinates as reverseCoordinates} from '../../../../../src/ol/geom/flat/reverse.js';


describe('ol.geom.flat.reverse', () => {

  describe('ol.geom.flat.reverse.coordinates', () => {

    describe('with a stride of 2', () => {

      test('can reverse empty flat coordinates', () => {
        const flatCoordinates = [];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).toHaveLength(0);
      });

      test('can reverse one flat coordinates', () => {
        const flatCoordinates = [1, 2];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).toEqual([1, 2]);
      });

      test('can reverse two flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).toEqual([3, 4, 1, 2]);
      });

      test('can reverse three flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).toEqual([5, 6, 3, 4, 1, 2]);
      });

      test('can reverse four flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).toEqual([7, 8, 5, 6, 3, 4, 1, 2]);
      });

    });

    describe('with a stride of 3', () => {

      test('can reverse empty flat coordinates', () => {
        const flatCoordinates = [];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).toHaveLength(0);
      });

      test('can reverse one flat coordinates', () => {
        const flatCoordinates = [1, 2, 3];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).toEqual([1, 2, 3]);
      });

      test('can reverse two flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).toEqual([4, 5, 6, 1, 2, 3]);
      });

      test('can reverse three flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).toEqual([7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

      test('can reverse four flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).toEqual([10, 11, 12, 7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

    });

    describe('with a stride of 4', () => {

      test('can reverse empty flat coordinates', () => {
        const flatCoordinates = [];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).toHaveLength(0);
      });

      test('can reverse one flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).toEqual([1, 2, 3, 4]);
      });

      test('can reverse two flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).toEqual([5, 6, 7, 8, 1, 2, 3, 4]);
      });

      test('can reverse three flat coordinates', () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).toEqual([9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4]);
      });

      test('can reverse four flat coordinates', () => {
        const flatCoordinates =
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        reverseCoordinates(flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).toEqual([13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4]);
      });

    });

  });

});
