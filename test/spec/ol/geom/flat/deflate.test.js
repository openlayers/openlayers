import {deflateCoordinates, deflateCoordinatesArray} from '../../../../../src/ol/geom/flat/deflate.js';


describe('ol.geom.flat.deflate', () => {

  describe('ol.geom.flat.deflate.deflateCoordinates', () => {

    let flatCoordinates;
    beforeEach(() => {
      flatCoordinates = [];
    });

    test('flattens coordinates', () => {
      const offset = deflateCoordinates(
        flatCoordinates, 0, [[1, 2], [3, 4]], 2);
      expect(offset).toBe(4);
      expect(flatCoordinates).toEqual([1, 2, 3, 4]);
    });

  });

  describe('ol.geom.flat.deflate.deflateCoordinatesArray', () => {

    let flatCoordinates;
    beforeEach(() => {
      flatCoordinates = [];
    });

    test('flattens arrays of coordinates', () => {
      const ends = deflateCoordinatesArray(flatCoordinates, 0,
        [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], 2);
      expect(ends).toEqual([4, 8]);
      expect(flatCoordinates).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

  });

});
