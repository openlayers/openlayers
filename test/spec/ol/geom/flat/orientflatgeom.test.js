goog.provide('ol.test.geom.flat.orient');

describe('ol.geom.flat.orient', function() {

  describe('ol.geom.flat.orient.linearRingIsClockwise', function() {

    it('identifies clockwise rings', function() {
      var flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0];
      var isClockwise = ol.geom.flat.orient.linearRingIsClockwise(
          flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).to.be(true);
    });

    it('identifies anti-clockwise rings', function() {
      var flatCoordinates = [2, 2, 3, 2, 3, 3, 2, 3];
      var isClockwise = ol.geom.flat.orient.linearRingIsClockwise(
          flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).to.be(false);
    });

  });

});

goog.require('ol.geom.flat.orient');
