import {linearRingIsClockwise, linearRingsAreOriented,
  linearRingssAreOriented, orientLinearRings, orientLinearRingsArray} from '../../../../../src/ol/geom/flat/orient.js';


describe('ol.geom.flat.orient', () => {

  describe('ol.geom.flat.orient.linearRingIsClockwise', () => {

    test('identifies clockwise rings', () => {
      const flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).toBe(true);
    });

    test('identifies anti-clockwise rings', () => {
      const flatCoordinates = [2, 2, 3, 2, 3, 3, 2, 3];
      const isClockwise = linearRingIsClockwise(
        flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).toBe(false);
    });

  });

  describe('ol.geom.flat.orient.linearRingsAreOriented', () => {
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

    test('checks for left-hand orientation by default', () => {
      expect(oriented(rightCoords, 0, ends, 2)).toBe(false);
      expect(oriented(leftCoords, 0, ends, 2)).toBe(true);
    });

    test('can check for right-hand orientation', () => {
      expect(oriented(rightCoords, 0, ends, 2, true)).toBe(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).toBe(false);
    });

  });

  describe('ol.geom.flat.orient.linearRingssAreOriented', () => {
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

    test('checks for left-hand orientation by default', () => {
      expect(oriented(rightCoords, 0, ends, 2)).toBe(false);
      expect(oriented(leftCoords, 0, ends, 2)).toBe(true);
    });

    test('can check for right-hand orientation', () => {
      expect(oriented(rightCoords, 0, ends, 2, true)).toBe(true);
      expect(oriented(leftCoords, 0, ends, 2, true)).toBe(false);
    });

  });

  describe('ol.geom.flat.orient.orientLinearRings', () => {
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

    test('orients using the left-hand rule by default', () => {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).toEqual(leftCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).toEqual(leftCoords);
    });

    test('can orient using the right-hand rule', () => {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).toEqual(rightCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).toEqual(rightCoords);
    });

  });

  describe('ol.geom.flat.orient.orientLinearRingsArray', () => {
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

    test('orients using the left-hand rule by default', () => {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2);
      expect(rightClone).toEqual(leftCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2);
      expect(leftClone).toEqual(leftCoords);
    });

    test('can orient using the right-hand rule', () => {
      const rightClone = rightCoords.slice();
      orient(rightClone, 0, ends, 2, true);
      expect(rightClone).toEqual(rightCoords);

      const leftClone = leftCoords.slice();
      orient(leftClone, 0, ends, 2, true);
      expect(leftClone).toEqual(rightCoords);
    });

  });


});
