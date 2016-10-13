goog.provide('ol.test.geom.flat.orient');

goog.require('ol.geom.flat.orient');


describe('ol.geom.flat.orient', function() {

  describe('ol.geom.flat.orient.linearRingIsClockwise()', function() {

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

  describe('ol.geom.flat.orient.linearRingsAreOriented()', function() {
    var oriented = ol.geom.flat.orient.linearRingsAreOriented;

    var rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    var leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    var ends = [10, 20];

    it('checks for left-hand orientation by default', function() {
      expect(oriented(rightCoords, 0, ends, 2)).to.be(false);
      expect(oriented(leftCoords, 0, ends, 2)).to.be(true);
    });

    it('can check for right-hand orientation', function() {
      expect(oriented(rightCoords, 0, ends, 2, true)).to.be(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).to.be(false);
    });

  });

  describe('ol.geom.flat.orient.linearRingssAreOriented()', function() {
    var oriented = ol.geom.flat.orient.linearRingssAreOriented;

    var rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45,
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    var leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45,
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    var ends = [[10, 20], [30, 40]];

    it('checks for left-hand orientation by default', function() {
      expect(oriented(rightCoords, 0, ends, 2)).to.be(false);
      expect(oriented(leftCoords, 0, ends, 2)).to.be(true);
    });

    it('can check for right-hand orientation', function() {
      expect(oriented(rightCoords, 0, ends, 2, true)).to.be(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).to.be(false);
    });

  });

  describe('ol.geom.flat.orient.orientLinearRings()', function() {
    var orient = ol.geom.flat.orient.orientLinearRings;

    var rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    var leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    var ends = [10, 20];

    it('orients using the left-hand rule by default', function() {
      var rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).to.eql(leftCoords);

      var leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).to.eql(leftCoords);
    });

    it('can orient using the right-hand rule', function() {
      var rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).to.eql(rightCoords);

      var leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).to.eql(rightCoords);
    });

  });

  describe('ol.geom.flat.orient.orientLinearRingss()', function() {
    var orient = ol.geom.flat.orient.orientLinearRingss;

    var rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45,
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    var leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45,
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    var ends = [[10, 20], [30, 40]];

    it('orients using the left-hand rule by default', function() {
      var rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).to.eql(leftCoords);

      var leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).to.eql(leftCoords);
    });

    it('can orient using the right-hand rule', function() {
      var rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).to.eql(rightCoords);

      var leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).to.eql(rightCoords);
    });

  });


});
