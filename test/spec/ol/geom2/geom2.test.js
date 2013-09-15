goog.provide('ol.test.geom2');


describe('ol.geom2', function() {

  var buf, dim;
  beforeEach(function() {
    buf = new ol.structs.Buffer([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 12);
    dim = 2;
  });

  describe('ol.geom2.getExtent', function() {

    it('returns the expected extent', function() {
      var extent = ol.geom2.getExtent(buf, dim);
      expect(extent).to.eql([0, 1, 10, 11]);
    });

  });

  describe('ol.geom2.packPoints', function() {

    it('packs points as expected', function() {
      var arr = [];
      var offset = ol.geom2.packPoints(arr, 0, [[0, 1], [2, 3], [4, 5]], 2);
      expect(offset).to.be(6);
      expect(arr).to.eql([0, 1, 2, 3, 4, 5]);
    });

    it('raises an exception if dimensions do not match', function() {
      expect(function() {
        ol.geom2.packPoints([], 0, [[0, 1, 2]], 2);
      }).to.throwException();
    });

  });

  describe('ol.geom2.unpackPoints', function() {

    it('unpacks points in two dimensions', function() {
      var unpackedPoints = ol.geom2.unpackPoints([0, 1, 2, 3, 4, 5], 0, 6, 2);
      expect(unpackedPoints).to.eql([[0, 1], [2, 3], [4, 5]]);
    });

    it('unpacks points in three dimensions', function() {
      var unpackedPoints = ol.geom2.unpackPoints([0, 1, 2, 3, 4, 5], 0, 6, 3);
      expect(unpackedPoints).to.eql([[0, 1, 2], [3, 4, 5]]);
    });

  });

});


goog.require('ol.geom2');
goog.require('ol.structs.Buffer');
