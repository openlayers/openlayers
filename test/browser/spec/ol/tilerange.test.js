import {assert} from 'chai';
import TileRange from '../../../../src/ol/TileRange.js';

describe('ol.TileRange', function () {
  describe('constructor', function () {
    it('creates a range', function () {
      const range = new TileRange(1, 3, 2, 4);
      assert.instanceOf(range, TileRange);
    });

    it('can represent a range of one tile', function () {
      const range = new TileRange(2, 2, 3, 3);
      assert.instanceOf(range, TileRange);
      assert.strictEqual(range.getHeight(), 1);
      assert.strictEqual(range.getWidth(), 1);
    });
  });

  describe('contains', function () {
    it('returns the expected value', function () {
      const tileRange = new TileRange(1, 3, 1, 3);
      assert.isFalse(tileRange.contains([0, 0, 0]));
      assert.isFalse(tileRange.contains([0, 0, 1]));
      assert.isFalse(tileRange.contains([0, 0, 2]));
      assert.isFalse(tileRange.contains([0, 0, 3]));
      assert.isFalse(tileRange.contains([0, 0, 4]));
      assert.isFalse(tileRange.contains([0, 1, 0]));
      assert.isOk(tileRange.contains([0, 1, 1]));
      assert.isOk(tileRange.contains([0, 1, 2]));
      assert.isOk(tileRange.contains([0, 1, 3]));
      assert.isFalse(tileRange.contains([0, 1, 4]));
      assert.isFalse(tileRange.contains([0, 2, 0]));
      assert.isOk(tileRange.contains([0, 2, 1]));
      assert.isOk(tileRange.contains([0, 2, 2]));
      assert.isOk(tileRange.contains([0, 2, 3]));
      assert.isFalse(tileRange.contains([0, 2, 4]));
      assert.isFalse(tileRange.contains([0, 3, 0]));
      assert.isOk(tileRange.contains([0, 3, 1]));
      assert.isOk(tileRange.contains([0, 3, 2]));
      assert.isOk(tileRange.contains([0, 3, 3]));
      assert.isFalse(tileRange.contains([0, 3, 4]));
      assert.isFalse(tileRange.contains([0, 4, 0]));
      assert.isFalse(tileRange.contains([0, 4, 1]));
      assert.isFalse(tileRange.contains([0, 4, 2]));
      assert.isFalse(tileRange.contains([0, 4, 3]));
      assert.isFalse(tileRange.contains([0, 4, 4]));
    });
  });

  describe('equals', function () {
    it('determines equivalence of two ranges', function () {
      const one = new TileRange(0, 2, 1, 4);
      const same = new TileRange(0, 2, 1, 4);
      const diff1 = new TileRange(0, 2, 1, 5);
      const diff2 = new TileRange(0, 3, 1, 4);
      const diff3 = new TileRange(0, 2, 2, 4);
      const diff4 = new TileRange(1, 2, 1, 4);
      assert.strictEqual(one.equals(same), true);
      assert.strictEqual(one.equals(diff1), false);
      assert.strictEqual(one.equals(diff2), false);
      assert.strictEqual(one.equals(diff3), false);
      assert.strictEqual(one.equals(diff4), false);
    });
  });

  describe('extent', function () {
    it('modifies range so it includes another', function () {
      const one = new TileRange(0, 2, 1, 4);
      const other = new TileRange(-1, -3, 10, 12);
      one.extend(other);

      assert.strictEqual(one.minX, -1);
      assert.strictEqual(one.maxX, 2);
      assert.strictEqual(one.minY, 1);
      assert.strictEqual(one.maxY, 12);
    });
  });

  describe('getSize', function () {
    it('returns the expected size', function () {
      const tileRange = new TileRange(0, 2, 1, 4);
      const size = tileRange.getSize();
      assert.deepEqual(size, [3, 4]);
    });
  });

  describe('intersects', function () {
    it('determines if two ranges overlap', function () {
      const one = new TileRange(0, 2, 1, 4);
      const overlapsRight = new TileRange(2, 4, 1, 4);
      const overlapsLeft = new TileRange(-3, 0, 1, 4);
      const overlapsTop = new TileRange(0, 2, 4, 5);
      const overlapsBottom = new TileRange(0, 2, -3, 1);
      assert.strictEqual(one.intersects(overlapsLeft), true);
      assert.strictEqual(one.intersects(overlapsRight), true);
      assert.strictEqual(one.intersects(overlapsTop), true);
      assert.strictEqual(one.intersects(overlapsBottom), true);

      const right = new TileRange(3, 5, 1, 4);
      const left = new TileRange(-3, -1, 1, 4);
      const above = new TileRange(0, 2, 5, 6);
      const below = new TileRange(0, 2, -3, 0);
      assert.strictEqual(one.intersects(right), false);
      assert.strictEqual(one.intersects(left), false);
      assert.strictEqual(one.intersects(above), false);
      assert.strictEqual(one.intersects(below), false);
    });
  });
});
