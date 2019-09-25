import {interpolatePoint} from '../../../../../src/ol/geom/flat/interpolate.js';


describe('ol.geom.flat.interpolate', () => {

  describe('ol.geom.flat.interpolate.interpolatePoint', () => {

    test('returns the expected value for single points', () => {
      const flatCoordinates = [0, 1];
      const point =
          interpolatePoint(flatCoordinates, 0, 2, 2, 0.5);
      expect(point).toEqual([0, 1]);
    });

    test('returns the expected value for simple line segments', () => {
      const flatCoordinates = [0, 1, 2, 3];
      const point =
          interpolatePoint(flatCoordinates, 0, 4, 2, 0.5);
      expect(point).toEqual([1, 2]);
    });

    test('returns the expected value when the mid point is an existing ' +
        'coordinate', () => {
      const flatCoordinates = [0, 1, 2, 3, 4, 5];
      const point = interpolatePoint(
        flatCoordinates, 0, 6, 2, 0.5);
      expect(point).toEqual([2, 3]);
    });

    test('also when vertices are repeated', () => {
      const flatCoordinates = [0, 1, 2, 3, 2, 3, 4, 5];
      const point = interpolatePoint(
        flatCoordinates, 0, 8, 2, 0.5);
      expect(point).toEqual([2, 3]);
    });

    test('returns the expected value when the midpoint falls halfway between ' +
        'two existing coordinates', () => {
      const flatCoordinates = [0, 1, 2, 3, 4, 5, 6, 7];
      const point = interpolatePoint(
        flatCoordinates, 0, 8, 2, 0.5);
      expect(point).toEqual([3, 4]);
    });

    test('also when vertices are repeated', () => {
      const flatCoordinates = [0, 1, 2, 3, 2, 3, 4, 5, 6, 7];
      const point = interpolatePoint(
        flatCoordinates, 0, 10, 2, 0.5);
      expect(point).toEqual([3, 4]);
    });

    test(
      'returns the expected value when the coordinates are not evenly spaced',
      () => {
        const flatCoordinates = [0, 1, 2, 3, 6, 7];
        const point = interpolatePoint(
          flatCoordinates, 0, 6, 2, 0.5);
        expect(point).toEqual([3, 4]);
      }
    );

    test('also when vertices are repeated', () => {
      const flatCoordinates = [0, 1, 2, 3, 2, 3, 6, 7];
      const point = interpolatePoint(
        flatCoordinates, 0, 8, 2, 0.5);
      expect(point).toEqual([3, 4]);
    });

    test('returns the expected value when using opt_dest', () => {
      const flatCoordinates = [0, 1, 2, 3, 6, 7];
      const point = interpolatePoint(
        flatCoordinates, 0, 6, 2, 0.5, [0, 0]);
      expect(point).toEqual([3, 4]);
    });

  });

});
