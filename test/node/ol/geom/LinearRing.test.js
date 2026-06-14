import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import expect from '../../expect.js';

describe('ol/geom/LinearRing.js', function () {
  describe('#intersectsExtent', function () {
    let linearRing;
    beforeEach(function () {
      linearRing = new LinearRing([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ]);
    });

    it('returns true when the extent intersects the boundary', function () {
      expect(linearRing.intersectsExtent([4, -1, 6, 1])).to.be(true);
    });

    it('returns false when the extent is inside the ring boundary', function () {
      expect(linearRing.intersectsExtent([2, 2, 3, 3])).to.be(false);
    });

    it("returns true for the geom's own extent", function () {
      expect(linearRing.intersectsExtent(linearRing.getExtent())).to.be(true);
    });
  });
});
