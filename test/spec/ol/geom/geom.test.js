goog.provide('ol.test.geom');


describe('ol.geom', function() {

  describe('ol.geom.deflateCoordinates', function() {

    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens coordinates', function() {
      var offset = ol.geom.deflateCoordinates(
          flatCoordinates, 0, [[1, 2], [3, 4]], 2);
      expect(offset).to.be(4);
      expect(flatCoordinates).to.eql([1, 2, 3, 4]);
    });

  });

  describe('ol.geom.deflateCoordinatess', function() {

    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens arrays of coordinates', function() {
      var ends = ol.geom.deflateCoordinatess(flatCoordinates, 0,
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], 2);
      expect(ends).to.eql([4, 8]);
      expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

  });

  describe('ol.geom.inflateCoordinates', function() {

    it('inflates coordinates', function() {
      var coordinates = ol.geom.inflateCoordinates([1, 2, 3, 4], 0, 4, 2);
      expect(coordinates).to.eql([[1, 2], [3, 4]]);
    });

  });

  describe('ol.geom.inflateCoordinatess', function() {

    it('inflates arrays of coordinates', function() {
      var coordinatess = ol.geom.inflateCoordinatess([1, 2, 3, 4, 5, 6, 7, 8],
          0, [4, 8], 2);
      expect(coordinatess).to.eql([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

});
