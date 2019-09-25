import {inflateCoordinates, inflateCoordinatesArray} from '../../../../../src/ol/geom/flat/inflate.js';


describe('ol.geom.flat.inflate', () => {

  describe('ol.geom.flat.inflate.inflateCoordinates', () => {

    test('inflates coordinates', () => {
      const coordinates = inflateCoordinates([1, 2, 3, 4], 0, 4, 2);
      expect(coordinates).toEqual([[1, 2], [3, 4]]);
    });

  });

  describe('ol.geom.flat.inflate.inflateCoordinatesArray', () => {

    test('inflates arrays of coordinates', () => {
      const coordinatess = inflateCoordinatesArray(
        [1, 2, 3, 4, 5, 6, 7, 8], 0, [4, 8], 2);
      expect(coordinatess).toEqual([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

});
