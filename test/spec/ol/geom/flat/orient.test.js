import {linearRingIsClockwise, linearRingsAreOriented,
  linearRingssAreOriented, orientLinearRings, orientLinearRingsArray} from '../../../../../src/ol/geom/flat/orient.js';


describe('ol.geom.flat.orient', function() {

  describe('ol.geom.flat.orient.linearRingIsClockwise', function() {

    it('identifies clockwise rings', function() {
      const flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).to.be(true);
    });

    it('identifies anti-clockwise rings', function() {
      const flatCoordinates = [2, 2, 3, 2, 3, 3, 2, 3];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).to.be(false);
    });

  });

  describe('ol.geom.flat.orient.linearRingsAreOriented', function() {
    const oriented = linearRingsAreOriented;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    const ends = [10, 20];

    it('checks for left-hand orientation by default', function() {
      expect(oriented(rightCoords, 0, ends, 2)).to.be(false);
      expect(oriented(leftCoords, 0, ends, 2)).to.be(true);
    });

    it('can check for right-hand orientation', function() {
      expect(oriented(rightCoords, 0, ends, 2, true)).to.be(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).to.be(false);
    });

  });

  describe('ol.geom.flat.orient.linearRingssAreOriented', function() {
    const oriented = linearRingssAreOriented;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45,
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45,
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    const ends = [[10, 20], [30, 40]];

    it('checks for left-hand orientation by default', function() {
      expect(oriented(rightCoords, 0, ends, 2)).to.be(false);
      expect(oriented(leftCoords, 0, ends, 2)).to.be(true);
    });

    it('can check for right-hand orientation', function() {
      expect(oriented(rightCoords, 0, ends, 2, true)).to.be(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).to.be(false);
    });

  });

  describe('ol.geom.flat.orient.orientLinearRings', function() {
    const orient = orientLinearRings;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    const ends = [10, 20];

    it('orients using the left-hand rule by default', function() {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).to.eql(leftCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).to.eql(leftCoords);
    });

    it('can orient using the right-hand rule', function() {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).to.eql(rightCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).to.eql(rightCoords);
    });

  });

  describe('ol.geom.flat.orient.orientLinearRingsArray', function() {
    const orient = orientLinearRingsArray;

    const rightCoords = [
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45,
      -180, -90, 180, -90, 180, 90, -180, 90, -180, -90,
      -100, -45, -100, 45, 100, 45, 100, -45, -100, -45
    ];

    const leftCoords = [
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45,
      -180, -90, -180, 90, 180, 90, 180, -90, -180, -90,
      -100, -45, 100, -45, 100, 45, -100, 45, -100, -45
    ];

    const ends = [[10, 20], [30, 40]];

    it('orients using the left-hand rule by default', function() {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).to.eql(leftCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).to.eql(leftCoords);
    });

    it('can orient using the right-hand rule', function() {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).to.eql(rightCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).to.eql(rightCoords);
    });

  });


});
