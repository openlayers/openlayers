import expect from '../../../expect.js';
import {linearRing, linearRings} from '../../../../../src/ol/geom/flat/area.js';

describe('ol/geom/flat/area.js', function () {
  describe('linearRing', function () {
    it('calculates the area of a triangle', function () {
      const area = linearRing([0, 0, 0.5, 1, 1, 0], 0, 6, 2);
      expect(area).to.be(0.5);
    });

    it('calculates the area of a unit square', function () {
      const area = linearRing([0, 0, 0, 1, 1, 1, 1, 0], 0, 8, 2);
      expect(area).to.be(1);
    });
  });

  describe('linearRings', function () {
    it('calculates the area with holes', function () {
      const area = linearRings(
        [0, 0, 0, 3, 3, 3, 3, 0, 1, 1, 2, 1, 2, 2, 1, 2],
        0,
        [8, 16],
        2
      );
      expect(area).to.be(8);
    });
  });
});
