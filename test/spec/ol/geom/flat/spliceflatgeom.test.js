goog.provide('ol.test.geom.flat.splice');

describe('ol.geom.flat.splice', function() {

  describe('ol.geom.flat.splice.coordinates', function() {

    describe('with stride 2', function() {

      it('can replace coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 2, 0, 2, [[5, 6]]);
        expect(flatCoordinates).to.eql([5, 6]);
      });

      it('can insert coordinates', function() {
        var flatCoordinates = [1, 2, 7, 8];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 2, 1, 0, [[3, 4], [5, 6]]);
        expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
      });

      it('can prepend coordinates', function() {
        var flatCoordinates = [3, 4];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 2, 0, 0, [[1, 2]]);
        expect(flatCoordinates).to.eql([1, 2, 3, 4]);
      });

      it('can append coordinates', function() {
        var flatCoordinates = [1, 2];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 2, 2, 0, [[3, 4]]);
        expect(flatCoordinates).to.eql([1, 2, 3, 4]);
      });

    });

    describe('with stride 3', function() {

      it('can replace coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 3, 0, 2, [[7, 8, 9]]);
        expect(flatCoordinates).to.eql([7, 8, 9]);
      });

      it('can insert coordinates', function() {
        var flatCoordinates = [1, 2, 3, 10, 11, 12];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 3, 1, 0, [[4, 5, 6], [7, 8, 9]]);
        expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      });

      it('can prepend coordinates', function() {
        var flatCoordinates = [4, 5, 6];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 3, 0, 0, [[1, 2, 3]]);
        expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6]);
      });

      it('can append coordinates', function() {
        var flatCoordinates = [1, 2, 3];
        ol.geom.flat.splice.coordinates(
            flatCoordinates, 3, 2, 0, [[4, 5, 6]]);
        expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6]);
      });
    });

  });

});

goog.require('ol.geom.flat.splice');
