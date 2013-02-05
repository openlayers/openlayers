goog.provide('ol.test.array');

describe('ol.array', function() {

  describe('binaryFindNearest', function() {
    it('returns expected value', function() {
      var arr = [1000, 500, 100];

      expect(ol.array.binaryFindNearest(arr, 10000)).toEqual(0);
      expect(ol.array.binaryFindNearest(arr, 1000)).toEqual(0);
      expect(ol.array.binaryFindNearest(arr, 900)).toEqual(0);

      expect(ol.array.binaryFindNearest(arr, 750)).toEqual(1);

      expect(ol.array.binaryFindNearest(arr, 550)).toEqual(1);
      expect(ol.array.binaryFindNearest(arr, 500)).toEqual(1);
      expect(ol.array.binaryFindNearest(arr, 450)).toEqual(1);

      expect(ol.array.binaryFindNearest(arr, 300)).toEqual(2);

      expect(ol.array.binaryFindNearest(arr, 200)).toEqual(2);
      expect(ol.array.binaryFindNearest(arr, 100)).toEqual(2);
      expect(ol.array.binaryFindNearest(arr, 50)).toEqual(2);
    });
  });

  describe('linearFindNearest', function() {
    it('returns expected value', function() {
      var arr = [1000, 500, 100];

      expect(ol.array.linearFindNearest(arr, 10000)).toEqual(0);
      expect(ol.array.linearFindNearest(arr, 1000)).toEqual(0);
      expect(ol.array.linearFindNearest(arr, 900)).toEqual(0);

      expect(ol.array.linearFindNearest(arr, 750)).toEqual(1);

      expect(ol.array.linearFindNearest(arr, 550)).toEqual(1);
      expect(ol.array.linearFindNearest(arr, 500)).toEqual(1);
      expect(ol.array.linearFindNearest(arr, 450)).toEqual(1);

      expect(ol.array.linearFindNearest(arr, 300)).toEqual(2);

      expect(ol.array.linearFindNearest(arr, 200)).toEqual(2);
      expect(ol.array.linearFindNearest(arr, 100)).toEqual(2);
      expect(ol.array.linearFindNearest(arr, 50)).toEqual(2);
    });
  });
});

goog.require('ol.array');
