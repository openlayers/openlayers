import {flipXY} from '../../../../../src/ol/geom/flat/flip.js';


describe('ol.geom.flat.flip', () => {

  describe('ol.geom.flat.flip.flipXY', () => {

    test('can flip XY coordinates', () => {
      const flatCoordinates = flipXY([1, 2, 3, 4], 0, 4, 2);
      expect(flatCoordinates).toEqual([2, 1, 4, 3]);
    });

    test('can flip XY coordinates while preserving other dimensions', () => {
      const flatCoordinates = flipXY([1, 2, 3, 4, 5, 6, 7, 8], 0, 8, 4);
      expect(flatCoordinates).toEqual([2, 1, 3, 4, 6, 5, 7, 8]);
    });

    test('can flip XY coordinates in place', () => {
      const flatCoordinates = [1, 2, 3, 4];
      expect(flipXY(flatCoordinates, 0, 4, 2, flatCoordinates)).toBe(flatCoordinates);
      expect(flatCoordinates).toEqual([2, 1, 4, 3]);
    });

    test(
      'can flip XY coordinates in place while preserving other dimensions',
      () => {
        const flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        expect(flipXY(flatCoordinates, 0, 9, 3, flatCoordinates)).toBe(flatCoordinates);
        expect(flatCoordinates).toEqual([2, 1, 3, 5, 4, 6, 8, 7, 9]);
      }
    );

  });

});
