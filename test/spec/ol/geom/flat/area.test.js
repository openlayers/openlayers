import {linearRing, linearRings} from '../../../../../src/ol/geom/flat/area.js';

describe('ol.geom.flat.area', () => {

  describe('ol.geom.flat.area.linearRing', () => {

    test('calculates the area of a triangle', () => {
      const area = linearRing([0, 0, 0.5, 1, 1, 0], 0, 6, 2);
      expect(area).toBe(0.5);
    });

    test('calculates the area of a unit square', () => {
      const area = linearRing([0, 0, 0, 1, 1, 1, 1, 0], 0, 8, 2);
      expect(area).toBe(1);
    });

  });

  describe('ol.geom.flat.area.linearRings', () => {

    test('calculates the area with holes', () => {
      const area = linearRings(
        [0, 0, 0, 3, 3, 3, 3, 0, 1, 1, 2, 1, 2, 2, 1, 2], 0, [8, 16], 2);
      expect(area).toBe(8);
    });

  });

});
