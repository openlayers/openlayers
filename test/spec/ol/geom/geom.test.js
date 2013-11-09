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

  describe('ol.geom.inflateCoordinates', function() {

    it('inflates coordinates', function() {
      var coordinates = ol.geom.inflateCoordinates([1, 2, 3, 4], 0, 4, 2);
      expect(coordinates).to.eql([[1, 2], [3, 4]]);
    });

  });

});
