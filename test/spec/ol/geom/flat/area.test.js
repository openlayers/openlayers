goog.provide('ol.test.geom.flat.area');

goog.require('ol.geom.flat.area');

describe('ol.geom.flat.area', function() {

  describe('ol.geom.flat.area.linearRing', function() {

    it('calculates the area of a triangle', function() {
      var area = ol.geom.flat.area.linearRing([0, 0, 0.5, 1, 1, 0], 0, 6, 2);
      expect(area).to.be(0.5);
    });

    it('calculates the area of a unit square', function() {
      var area =
          ol.geom.flat.area.linearRing([0, 0, 0, 1, 1, 1, 1, 0], 0, 8, 2);
      expect(area).to.be(1);
    });

  });

  describe('ol.geom.flat.area.linearRings', function() {

    it('calculates the area with holes', function() {
      var area = ol.geom.flat.area.linearRings(
          [0, 0, 0, 3, 3, 3, 3, 0, 1, 1, 2, 1, 2, 2, 1, 2], 0, [8, 16], 2);
      expect(area).to.be(8);
    });

  });

});
