import _ol_geom_flat_inflate_ from '../../../../../src/ol/geom/flat/inflate.js';


describe('ol.geom.flat.inflate', function() {

  describe('ol.geom.flat.inflate.coordinates', function() {

    it('inflates coordinates', function() {
      const coordinates = _ol_geom_flat_inflate_.coordinates([1, 2, 3, 4], 0, 4, 2);
      expect(coordinates).to.eql([[1, 2], [3, 4]]);
    });

  });

  describe('ol.geom.flat.inflate.coordinatess', function() {

    it('inflates arrays of coordinates', function() {
      const coordinatess = _ol_geom_flat_inflate_.coordinatess(
        [1, 2, 3, 4, 5, 6, 7, 8], 0, [4, 8], 2);
      expect(coordinatess).to.eql([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

});
