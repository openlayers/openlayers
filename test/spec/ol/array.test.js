goog.provide('ol.test.array');

describe('ol.array', function() {

  describe('binaryFindNearest', function() {
    it('returns expected value', function() {
      var arr = [1000, 500, 100];

      expect(ol.array.binaryFindNearest(arr, 10000)).to.eql(0);
      expect(ol.array.binaryFindNearest(arr, 1000)).to.eql(0);
      expect(ol.array.binaryFindNearest(arr, 900)).to.eql(0);

      expect(ol.array.binaryFindNearest(arr, 750)).to.eql(1);

      expect(ol.array.binaryFindNearest(arr, 550)).to.eql(1);
      expect(ol.array.binaryFindNearest(arr, 500)).to.eql(1);
      expect(ol.array.binaryFindNearest(arr, 450)).to.eql(1);

      expect(ol.array.binaryFindNearest(arr, 300)).to.eql(2);

      expect(ol.array.binaryFindNearest(arr, 200)).to.eql(2);
      expect(ol.array.binaryFindNearest(arr, 100)).to.eql(2);
      expect(ol.array.binaryFindNearest(arr, 50)).to.eql(2);
    });
  });

  describe('linearFindNearest', function() {
    it('returns expected value', function() {
      var arr = [1000, 500, 100];

      expect(ol.array.linearFindNearest(arr, 10000, 0)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 10000, 1)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 10000, -1)).to.eql(0);

      expect(ol.array.linearFindNearest(arr, 1000, 0)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 1000, 1)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 1000, -1)).to.eql(0);

      expect(ol.array.linearFindNearest(arr, 900, 0)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 900, 1)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 900, -1)).to.eql(1);

      expect(ol.array.linearFindNearest(arr, 750, 0)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 750, 1)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 750, -1)).to.eql(1);

      expect(ol.array.linearFindNearest(arr, 550, 0)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 550, 1)).to.eql(0);
      expect(ol.array.linearFindNearest(arr, 550, -1)).to.eql(1);

      expect(ol.array.linearFindNearest(arr, 500, 0)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 500, 1)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 500, -1)).to.eql(1);

      expect(ol.array.linearFindNearest(arr, 450, 0)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 450, 1)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 450, -1)).to.eql(2);

      expect(ol.array.linearFindNearest(arr, 300, 0)).to.eql(2);
      expect(ol.array.linearFindNearest(arr, 300, 1)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 300, -1)).to.eql(2);

      expect(ol.array.linearFindNearest(arr, 200, 0)).to.eql(2);
      expect(ol.array.linearFindNearest(arr, 200, 1)).to.eql(1);
      expect(ol.array.linearFindNearest(arr, 200, -1)).to.eql(2);

      expect(ol.array.linearFindNearest(arr, 100, 0)).to.eql(2);
      expect(ol.array.linearFindNearest(arr, 100, 1)).to.eql(2);
      expect(ol.array.linearFindNearest(arr, 100, -1)).to.eql(2);

      expect(ol.array.linearFindNearest(arr, 50, 0)).to.eql(2);
      expect(ol.array.linearFindNearest(arr, 50, 1)).to.eql(2);
      expect(ol.array.linearFindNearest(arr, 50, -1)).to.eql(2);
    });
  });
});

goog.require('ol.array');
