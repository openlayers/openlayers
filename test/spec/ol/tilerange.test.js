goog.provide('ol.test.TileRange');

describe('ol.TileRange', function() {

  describe('constructor', function() {
    it('creates a range', function() {
      var range = new ol.TileRange(1, 2, 3, 4);
      expect(range).toBeA(ol.TileRange);
    });

    it('can represent a range of one tile', function() {
      var range = new ol.TileRange(2, 3, 2, 3);
      expect(range).toBeA(ol.TileRange);
      expect(range.getHeight()).toBe(1);
      expect(range.getWidth()).toBe(1);
    });
  });

  describe('contains', function() {
    it('returns the expected value', function() {
      var tileRange = new ol.TileRange(1, 1, 3, 3);
      expect(tileRange.contains(new ol.TileCoord(0, 0, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 1))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 2))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 3))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 0, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 1))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 2))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 3))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 1, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 1))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 2))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 3))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 2, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 1))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 2))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 3))).toBeTruthy();
      expect(tileRange.contains(new ol.TileCoord(0, 3, 4))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 0))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 1))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 2))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 3))).toBeFalsy();
      expect(tileRange.contains(new ol.TileCoord(0, 4, 4))).toBeFalsy();
    });
  });

  describe('boundingTileRange', function() {
    it('returns the expected TileRange', function() {
      var tileRange = new ol.TileRange.boundingTileRange(
          new ol.TileCoord(3, 1, 3),
          new ol.TileCoord(3, 2, 0));
      expect(tileRange.minX).toEqual(1);
      expect(tileRange.minY).toEqual(0);
      expect(tileRange.maxX).toEqual(2);
      expect(tileRange.maxY).toEqual(3);
    });

    describe('with mixed z', function() {
      expect(function() {
        var tileRange = new ol.TileRange.boundingTileRange(
            new ol.TileCoord(3, 1, 3),
            new ol.TileCoord(4, 2, 0));
      }).toThrow();
    });
  });

  describe('equals', function() {
    it('determines equivalence of two ranges', function() {
      var one = new ol.TileRange(0, 1, 2, 4);
      var same = new ol.TileRange(0, 1, 2, 4);
      var diff1 = new ol.TileRange(0, 1, 2, 5);
      var diff2 = new ol.TileRange(0, 1, 3, 4);
      var diff3 = new ol.TileRange(0, 2, 2, 4);
      var diff4 = new ol.TileRange(1, 1, 2, 4);
      expect(one.equals(same)).toBe(true);
      expect(one.equals(diff1)).toBe(false);
      expect(one.equals(diff2)).toBe(false);
      expect(one.equals(diff3)).toBe(false);
      expect(one.equals(diff4)).toBe(false);
    });
  });

  describe('extent', function() {
    it('modifies range so it includes another', function() {
      var one = new ol.TileRange(0, 1, 2, 4);
      var other = new ol.TileRange(-1, 10, -3, 12);
      one.extend(other);

      expect(one.minX).toBe(-1);
      expect(one.minY).toBe(1);
      expect(one.maxX).toBe(2);
      expect(one.maxY).toBe(12);

    });
  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var tileRange = new ol.TileRange(0, 1, 2, 4);
      var size = tileRange.getSize();
      expect(size.width).toEqual(3);
      expect(size.height).toEqual(4);
    });
  });

  describe('intersects', function() {
    it('determines if two ranges overlap', function() {
      var one = new ol.TileRange(0, 1, 2, 4);
      var overlapsRight = new ol.TileRange(2, 1, 4, 4);
      var overlapsLeft = new ol.TileRange(-3, 1, 0, 4);
      var overlapsTop = new ol.TileRange(0, 4, 2, 5);
      var overlapsBottom = new ol.TileRange(0, -3, 2, 1);
      expect(one.intersects(overlapsLeft)).toBe(true);
      expect(one.intersects(overlapsRight)).toBe(true);
      expect(one.intersects(overlapsTop)).toBe(true);
      expect(one.intersects(overlapsBottom)).toBe(true);

      var right = new ol.TileRange(3, 1, 5, 4);
      var left = new ol.TileRange(-3, 1, -1, 4);
      var above = new ol.TileRange(0, 5, 2, 6);
      var below = new ol.TileRange(0, -3, 2, 0);
      expect(one.intersects(right)).toBe(false);
      expect(one.intersects(left)).toBe(false);
      expect(one.intersects(above)).toBe(false);
      expect(one.intersects(below)).toBe(false);
    });
  });

});

goog.require('ol.TileCoord');
goog.require('ol.TileRange');
