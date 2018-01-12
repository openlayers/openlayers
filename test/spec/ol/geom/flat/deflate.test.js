import _ol_geom_flat_deflate_ from '../../../../../src/ol/geom/flat/deflate.js';


describe('ol.geom.flat.deflate', function() {

  describe('ol.geom.flat.deflate.coordinates', function() {

    let flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens coordinates', function() {
      const offset = _ol_geom_flat_deflate_.coordinates(
        flatCoordinates, 0, [[1, 2], [3, 4]], 2);
      expect(offset).to.be(4);
      expect(flatCoordinates).to.eql([1, 2, 3, 4]);
    });

  });

  describe('ol.geom.flat.deflate.coordinatess', function() {

    let flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens arrays of coordinates', function() {
      const ends = _ol_geom_flat_deflate_.coordinatess(flatCoordinates, 0,
        [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], 2);
      expect(ends).to.eql([4, 8]);
      expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

  });

});
