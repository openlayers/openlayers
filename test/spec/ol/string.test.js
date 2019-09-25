import {compareVersions, padNumber} from '../../../src/ol/string.js';


describe('ol.string', () => {

  describe('ol.string.padNumber', () => {

    test('returns the correct padding without precision', () => {
      expect(padNumber(6.5, 2)).toBe('06.5');
      expect(padNumber(6.5, 3)).toBe('006.5');
      expect(padNumber(1.25, 2)).toBe('01.25');
      expect(padNumber(5, 3)).toBe('005');
    });

    test('returns the same string when padding is less than length', () => {
      expect(padNumber(6.5, 0)).toBe('6.5');
      expect(padNumber(6.5, 1)).toBe('6.5');
      expect(padNumber(1.25, 0)).toBe('1.25');
      expect(padNumber(5, 0)).toBe('5');
      expect(padNumber(5, 1)).toBe('5');
    });

    test('returns the correct string precision is given', () => {
      expect(padNumber(6.5, 0, 2)).toBe('6.50');
      expect(padNumber(6.5, 1, 2)).toBe('6.50');
      expect(padNumber(6.5, 2, 2)).toBe('06.50');
      expect(padNumber(1.25, 2, 3)).toBe('01.250');
      expect(padNumber(1.25, 2, 1)).toBe('01.3');
      expect(padNumber(9.9, 2, 0)).toBe('10');
      expect(padNumber(5, 0, 0)).toBe('5');
      expect(padNumber(5, 1, 1)).toBe('5.0');
      expect(padNumber(5, 2, 1)).toBe('05.0');
      expect(padNumber(5, 2, 0)).toBe('05');
    });

  });

  describe('ol.string.compareVersions', () => {
    test('should return the correct value for number input', () => {
      expect(compareVersions(1, 1)).toBe(0);
      expect(compareVersions(1.0, 1.1)).toBeLessThan(0);
      expect(compareVersions(2.0, 1.1)).toBeGreaterThan(0);
    });
    test('should return the correct value for string input', () => {
      expect(compareVersions('1.0', '1.0')).toBe(0);
      expect(compareVersions('1.0.0.0', '1.0')).toBe(0);
      expect(compareVersions('1.000', '1.0')).toBe(0);
      expect(compareVersions('1.0.2.1', '1.1')).toBeLessThan(0);
      expect(compareVersions('1.1', '1.0.2.1')).toBeGreaterThan(0);
      expect(compareVersions('1', '1.1')).toBeLessThan(0);
      expect(compareVersions('2.2', '2')).toBeGreaterThan(0);

      expect(compareVersions('9.5', '9.10')).toBeLessThan(0);
      expect(compareVersions('9.5', '9.11')).toBeLessThan(0);
      expect(compareVersions('9.11', '9.10')).toBeGreaterThan(0);
      expect(compareVersions('9.1', '9.10')).toBeLessThan(0);
      expect(compareVersions('9.1.1', '9.10')).toBeLessThan(0);
      expect(compareVersions('9.1.1', '9.11')).toBeLessThan(0);

      expect(compareVersions(' 7', '6')).toBeGreaterThan(0);
      expect(compareVersions('7 ', '6')).toBeGreaterThan(0);
      expect(compareVersions(' 7 ', '6')).toBeGreaterThan(0);
      expect(compareVersions('7', ' 6')).toBeGreaterThan(0);
      expect(compareVersions('7', '6 ')).toBeGreaterThan(0);
      expect(compareVersions('7', ' 6 ')).toBeGreaterThan(0);
      expect(compareVersions(' 7', ' 6')).toBeGreaterThan(0);
      expect(compareVersions('7 ', '6 ')).toBeGreaterThan(0);
      expect(compareVersions(' 7 ', ' 6 ')).toBeGreaterThan(0);
    });
  });
});
