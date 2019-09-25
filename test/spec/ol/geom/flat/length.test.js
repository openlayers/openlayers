import {lineStringLength, linearRingLength} from '../../../../../src/ol/geom/flat/length.js';


describe('ol.geom.flat.length', () => {

  describe('ol.geom.flat.length.lineStringLength', () => {

    describe('stride = 2', () => {
      const flatCoords = [0, 0, 1, 0, 1, 1, 0, 1];
      const stride = 2;

      test('calculates the total length of a lineString', () => {
        const offset = 0;
        const end = 8;
        const expected = 3;
        const got = lineStringLength(flatCoords, offset, end, stride);
        expect(got).toBe(expected);
      });

      test('calculates a partwise length of a lineString (offset)', () => {
        const offset = 2;
        const end = 8;
        const expected = 2;
        const got = lineStringLength(flatCoords, offset, end, stride);
        expect(got).toBe(expected);
      });

      test('calculates a partwise length of a lineString (end)', () => {
        const offset = 0;
        const end = 4;
        const expected = 1;
        const got = lineStringLength(flatCoords, offset, end, stride);
        expect(got).toBe(expected);
      });

    });

    describe('stride = 3', () => {
      const flatCoords = [0, 0, 42, 1, 0, 42, 1, 1, 42, 0, 1, 42];
      const stride = 3;

      test('calculates the total length of a lineString', () => {
        const offset = 0;
        const end = 12;
        const expected = 3;
        const got = lineStringLength(flatCoords, offset, end, stride);
        expect(got).toBe(expected);
      });

      test('calculates a partwise length of a lineString (offset)', () => {
        const offset = 3;
        const end = 12;
        const expected = 2;
        const got = lineStringLength(flatCoords, offset, end, stride);
        expect(got).toBe(expected);
      });

      test('calculates a partwise length of a lineString (end)', () => {
        const offset = 0;
        const end = 6;
        const expected = 1;
        const got = lineStringLength(flatCoords, offset, end, stride);
        expect(got).toBe(expected);
      });

    });
  });

  describe('ol.geom.flat.length.linearRingLength', () => {

    test('calculates the total length of a simple linearRing', () => {
      const flatCoords = [0, 0, 1, 0, 1, 1, 0, 1];
      const stride = 2;
      const offset = 0;
      const end = 8;
      const expected = 4;
      const got = linearRingLength(flatCoords, offset, end, stride);
      expect(got).toBe(expected);
    });

    test('calculates the total length of a figure-8 linearRing', () => {
      const flatCoords = [0, 0, 1, 0, 1, 1, 0, 1, 0, -1, -1, -1, -1, 0];
      const stride = 2;
      const offset = 0;
      const end = 14;
      const expected = 8;
      const got = linearRingLength(flatCoords, offset, end, stride);
      expect(got).toBe(expected);
    });

  });

});
