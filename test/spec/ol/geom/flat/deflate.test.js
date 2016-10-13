goog.provide('ol.test.geom.flat.deflate');

goog.require('ol.geom.flat.deflate');


describe('ol.geom.flat.deflate', function() {

  describe('ol.geom.flat.deflate.coordinates', function() {

    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens coordinates', function() {
      var offset = ol.geom.flat.deflate.coordinates(
          flatCoordinates, 0, [[1, 2], [3, 4]], 2);
      expect(offset).to.be(4);
      expect(flatCoordinates).to.eql([1, 2, 3, 4]);
    });

  });

  describe('ol.geom.flat.deflate.coordinatess', function() {

    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens arrays of coordinates', function() {
      var ends = ol.geom.flat.deflate.coordinatess(flatCoordinates, 0,
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], 2);
      expect(ends).to.eql([4, 8]);
      expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

  });

});
