import {assert} from 'chai';
import {compareVersions, padNumber} from '../../../../src/ol/string.js';

describe('ol.string', function () {
  describe('ol.string.padNumber', function () {
    it('returns the correct padding without precision', function () {
      assert.strictEqual(padNumber(6.5, 2), '06.5');
      assert.strictEqual(padNumber(6.5, 3), '006.5');
      assert.strictEqual(padNumber(1.25, 2), '01.25');
      assert.strictEqual(padNumber(5, 3), '005');
    });

    it('returns the same string when padding is less than length', function () {
      assert.strictEqual(padNumber(6.5, 0), '6.5');
      assert.strictEqual(padNumber(6.5, 1), '6.5');
      assert.strictEqual(padNumber(1.25, 0), '1.25');
      assert.strictEqual(padNumber(5, 0), '5');
      assert.strictEqual(padNumber(5, 1), '5');
    });

    it('returns the correct string precision is given', function () {
      assert.strictEqual(padNumber(6.5, 0, 2), '6.50');
      assert.strictEqual(padNumber(6.5, 1, 2), '6.50');
      assert.strictEqual(padNumber(6.5, 2, 2), '06.50');
      assert.strictEqual(padNumber(1.25, 2, 3), '01.250');
      assert.strictEqual(padNumber(1.25, 2, 1), '01.3');
      assert.strictEqual(padNumber(9.9, 2, 0), '10');
      assert.strictEqual(padNumber(5, 0, 0), '5');
      assert.strictEqual(padNumber(5, 1, 1), '5.0');
      assert.strictEqual(padNumber(5, 2, 1), '05.0');
      assert.strictEqual(padNumber(5, 2, 0), '05');
    });
  });

  describe('ol.string.compareVersions', function () {
    it('should return the correct value for number input', function () {
      assert.strictEqual(compareVersions(1, 1), 0);
      assert.isBelow(compareVersions(1.0, 1.1), 0);
      assert.isAbove(compareVersions(2.0, 1.1), 0);
    });
    it('should return the correct value for string input', function () {
      assert.strictEqual(compareVersions('1.0', '1.0'), 0);
      assert.strictEqual(compareVersions('1.0.0.0', '1.0'), 0);
      assert.strictEqual(compareVersions('1.000', '1.0'), 0);
      assert.isBelow(compareVersions('1.0.2.1', '1.1'), 0);
      assert.isAbove(compareVersions('1.1', '1.0.2.1'), 0);
      assert.isBelow(compareVersions('1', '1.1'), 0);
      assert.isAbove(compareVersions('2.2', '2'), 0);

      assert.isBelow(compareVersions('9.5', '9.10'), 0);
      assert.isBelow(compareVersions('9.5', '9.11'), 0);
      assert.isAbove(compareVersions('9.11', '9.10'), 0);
      assert.isBelow(compareVersions('9.1', '9.10'), 0);
      assert.isBelow(compareVersions('9.1.1', '9.10'), 0);
      assert.isBelow(compareVersions('9.1.1', '9.11'), 0);

      assert.isAbove(compareVersions(' 7', '6'), 0);
      assert.isAbove(compareVersions('7 ', '6'), 0);
      assert.isAbove(compareVersions(' 7 ', '6'), 0);
      assert.isAbove(compareVersions('7', ' 6'), 0);
      assert.isAbove(compareVersions('7', '6 '), 0);
      assert.isAbove(compareVersions('7', ' 6 '), 0);
      assert.isAbove(compareVersions(' 7', ' 6'), 0);
      assert.isAbove(compareVersions('7 ', '6 '), 0);
      assert.isAbove(compareVersions(' 7 ', ' 6 '), 0);
    });
  });
});
