import TileRange from '../../../src/ol/TileRange.js';


describe('ol.TileRange', () => {

  describe('constructor', () => {
    test('creates a range', () => {
      const range = new TileRange(1, 3, 2, 4);
      expect(range).toBeInstanceOf(TileRange);
    });

    test('can represent a range of one tile', () => {
      const range = new TileRange(2, 2, 3, 3);
      expect(range).toBeInstanceOf(TileRange);
      expect(range.getHeight()).toBe(1);
      expect(range.getWidth()).toBe(1);
    });
  });

  describe('contains', () => {
    test('returns the expected value', () => {
      const tileRange = new TileRange(1, 3, 1, 3);
      expect(tileRange.contains([0, 0, 0])).not.toBe();
      expect(tileRange.contains([0, 0, 1])).not.toBe();
      expect(tileRange.contains([0, 0, 2])).not.toBe();
      expect(tileRange.contains([0, 0, 3])).not.toBe();
      expect(tileRange.contains([0, 0, 4])).not.toBe();
      expect(tileRange.contains([0, 1, 0])).not.toBe();
      expect(tileRange.contains([0, 1, 1])).toBeTruthy();
      expect(tileRange.contains([0, 1, 2])).toBeTruthy();
      expect(tileRange.contains([0, 1, 3])).toBeTruthy();
      expect(tileRange.contains([0, 1, 4])).not.toBe();
      expect(tileRange.contains([0, 2, 0])).not.toBe();
      expect(tileRange.contains([0, 2, 1])).toBeTruthy();
      expect(tileRange.contains([0, 2, 2])).toBeTruthy();
      expect(tileRange.contains([0, 2, 3])).toBeTruthy();
      expect(tileRange.contains([0, 2, 4])).not.toBe();
      expect(tileRange.contains([0, 3, 0])).not.toBe();
      expect(tileRange.contains([0, 3, 1])).toBeTruthy();
      expect(tileRange.contains([0, 3, 2])).toBeTruthy();
      expect(tileRange.contains([0, 3, 3])).toBeTruthy();
      expect(tileRange.contains([0, 3, 4])).not.toBe();
      expect(tileRange.contains([0, 4, 0])).not.toBe();
      expect(tileRange.contains([0, 4, 1])).not.toBe();
      expect(tileRange.contains([0, 4, 2])).not.toBe();
      expect(tileRange.contains([0, 4, 3])).not.toBe();
      expect(tileRange.contains([0, 4, 4])).not.toBe();
    });
  });

  describe('equals', () => {
    test('determines equivalence of two ranges', () => {
      const one = new TileRange(0, 2, 1, 4);
      const same = new TileRange(0, 2, 1, 4);
      const diff1 = new TileRange(0, 2, 1, 5);
      const diff2 = new TileRange(0, 3, 1, 4);
      const diff3 = new TileRange(0, 2, 2, 4);
      const diff4 = new TileRange(1, 2, 1, 4);
      expect(one.equals(same)).toBe(true);
      expect(one.equals(diff1)).toBe(false);
      expect(one.equals(diff2)).toBe(false);
      expect(one.equals(diff3)).toBe(false);
      expect(one.equals(diff4)).toBe(false);
    });
  });

  describe('extent', () => {
    test('modifies range so it includes another', () => {
      const one = new TileRange(0, 2, 1, 4);
      const other = new TileRange(-1, -3, 10, 12);
      one.extend(other);

      expect(one.minX).toBe(-1);
      expect(one.maxX).toBe(2);
      expect(one.minY).toBe(1);
      expect(one.maxY).toBe(12);

    });
  });

  describe('getSize', () => {
    test('returns the expected size', () => {
      const tileRange = new TileRange(0, 2, 1, 4);
      const size = tileRange.getSize();
      expect(size).toEqual([3, 4]);
    });
  });

  describe('intersects', () => {
    test('determines if two ranges overlap', () => {
      const one = new TileRange(0, 2, 1, 4);
      const overlapsRight = new TileRange(2, 4, 1, 4);
      const overlapsLeft = new TileRange(-3, 0, 1, 4);
      const overlapsTop = new TileRange(0, 2, 4, 5);
      const overlapsBottom = new TileRange(0, 2, -3, 1);
      expect(one.intersects(overlapsLeft)).toBe(true);
      expect(one.intersects(overlapsRight)).toBe(true);
      expect(one.intersects(overlapsTop)).toBe(true);
      expect(one.intersects(overlapsBottom)).toBe(true);

      const right = new TileRange(3, 5, 1, 4);
      const left = new TileRange(-3, -1, 1, 4);
      const above = new TileRange(0, 2, 5, 6);
      const below = new TileRange(0, 2, -3, 0);
      expect(one.intersects(right)).toBe(false);
      expect(one.intersects(left)).toBe(false);
      expect(one.intersects(above)).toBe(false);
      expect(one.intersects(below)).toBe(false);
    });
  });

});
