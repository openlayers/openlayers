import {
  asArray,
  asString,
  fromString,
  normalize,
  toString
} from '../../../src/ol/color.js';

describe('ol.color', () => {

  describe('asArray()', () => {

    test('returns the same for an array', () => {
      const color = [1, 2, 3, 0.4];
      const got = asArray(color);
      expect(got).toBe(color);
    });

    test('returns an array given an rgba string', () => {
      const color = asArray('rgba(1,2,3,0.4)');
      expect(color).toEqual([1, 2, 3, 0.4]);
    });

    test('returns an array given an rgb string', () => {
      const color = asArray('rgb(1,2,3)');
      expect(color).toEqual([1, 2, 3, 1]);
    });

    test('returns an array given a hex string', () => {
      const color = asArray('#00ccff');
      expect(color).toEqual([0, 204, 255, 1]);
    });

    test('returns an array given a hex string with alpha', () => {
      const color = asArray('#00ccffb0');
      expect(color).toEqual([0, 204, 255, 176 / 255]);
    });

  });

  describe('asString()', () => {

    test('returns the same for a string', () => {
      const color = 'rgba(0,1,2,0.3)';
      const got = asString(color);
      expect(got).toBe(color);
    });

    test('returns a string given an rgba array', () => {
      const color = asString([1, 2, 3, 0.4]);
      expect(color).toEqual('rgba(1,2,3,0.4)');
    });

    test('returns a string given an rgb array', () => {
      const color = asString([1, 2, 3]);
      expect(color).toEqual('rgba(1,2,3,1)');
    });

  });

  describe('fromString()', () => {

    test('can parse 3-digit hex colors', () => {
      expect(fromString('#087')).toEqual([0, 136, 119, 1]);
    });

    test('can parse 4-digit hex colors', () => {
      expect(fromString('#0876')).toEqual([0, 136, 119, 102 / 255]);
    });

    test('can parse 6-digit hex colors', () => {
      expect(fromString('#56789a')).toEqual([86, 120, 154, 1]);
    });

    test('can parse 8-digit hex colors', () => {
      expect(fromString('#56789acc')).toEqual([86, 120, 154, 204 / 255]);
    });

    test('can parse rgb colors', () => {
      expect(fromString('rgb(0, 0, 255)')).toEqual([0, 0, 255, 1]);
    });

    test('ignores whitespace before, between & after numbers (rgb)', () => {
      expect(fromString('rgb( \t 0  ,   0 \n , 255  )')).toEqual([0, 0, 255, 1]);
    });

    test('can parse rgba colors', () => {
      expect(fromString('rgba(255, 255, 0, 0)')).toEqual([255, 255, 0, 0]);
      expect(fromString('rgba(255, 255, 0, 0.0)')).toEqual([255, 255, 0, 0]);
      expect(fromString('rgba(255, 255, 0, 0.0000000000000000)')).toEqual([255, 255, 0, 0]);
      expect(fromString('rgba(255, 255, 0, 0.1)')).toEqual([255, 255, 0, 0.1]);
      expect(fromString('rgba(255, 255, 0, 0.1111111111111111)')).toEqual([255, 255, 0, 0.1111111111111111]);
      expect(fromString('rgba(255, 255, 0, 1)')).toEqual([255, 255, 0, 1]);
      expect(fromString('rgba(255, 255, 0, 1.0)')).toEqual([255, 255, 0, 1]);
      expect(fromString('rgba(255, 255, 0, 1.0000000000000000)')).toEqual([255, 255, 0, 1]);
      expect(fromString('rgba(255, 255, 0, 0.123456789012345678901234567890)')).toEqual([255, 255, 0, 0.123456789012345678901234567890]);
    });

    test('ignores whitespace before, between & after numbers (rgba)', () => {
      expect(fromString('rgba( \t 0  ,   0 \n ,   255  ,   0.4711   )')).toEqual([0, 0, 255, 0.4711]);
    });

    test('throws an error on invalid colors', () => {
      const invalidColors = ['tuesday', '#12345', '#1234567'];
      let i, ii;
      for (i = 0, ii = invalidColors.length; i < ii; ++i) {
        expect(function() {
          fromString(invalidColors[i]);
        }).toThrow();
      }
    });

  });

  describe('normalize()', () => {

    test('clamps out-of-range channels', () => {
      expect(normalize([-1, 256, 0, 2])).toEqual([0, 255, 0, 1]);
    });

    test('rounds color channels to integers', () => {
      expect(normalize([1.2, 2.5, 3.7, 1])).toEqual([1, 3, 4, 1]);
    });

  });

  describe('toString()', () => {

    test('converts valid colors', () => {
      expect(toString([1, 2, 3, 0.4])).toBe('rgba(1,2,3,0.4)');
    });

    test('rounds to integers if needed', () => {
      expect(toString([1.2, 2.5, 3.7, 0.4])).toBe('rgba(1,3,4,0.4)');
    });

    test('sets default alpha value if undefined', () => {
      expect(toString([0, 0, 0])).toBe('rgba(0,0,0,1)');
    });

  });
});
