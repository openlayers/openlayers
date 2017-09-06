

import _ol_geom_flat_reverse_ from '../../../../../src/ol/geom/flat/reverse';


describe('ol.geom.flat.reverse', function() {

  describe('ol.geom.flat.reverse.coordinates', function() {

    describe('with a stride of 2', function() {

      it('can reverse empty flat coordinates', function() {
        var flatCoordinates = [];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.be.empty();
      });

      it('can reverse one flat coordinates', function() {
        var flatCoordinates = [1, 2];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([1, 2]);
      });

      it('can reverse two flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([3, 4, 1, 2]);
      });

      it('can reverse three flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([5, 6, 3, 4, 1, 2]);
      });

      it('can reverse four flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([7, 8, 5, 6, 3, 4, 1, 2]);
      });

    });

    describe('with a stride of 3', function() {

      it('can reverse empty flat coordinates', function() {
        var flatCoordinates = [];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.be.empty();
      });

      it('can reverse one flat coordinates', function() {
        var flatCoordinates = [1, 2, 3];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([1, 2, 3]);
      });

      it('can reverse two flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([4, 5, 6, 1, 2, 3]);
      });

      it('can reverse three flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

      it('can reverse four flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([10, 11, 12, 7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

    });

    describe('with a stride of 4', function() {

      it('can reverse empty flat coordinates', function() {
        var flatCoordinates = [];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.be.empty();
      });

      it('can reverse one flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql([1, 2, 3, 4]);
      });

      it('can reverse two flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql([5, 6, 7, 8, 1, 2, 3, 4]);
      });

      it('can reverse three flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql([9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4]);
      });

      it('can reverse four flat coordinates', function() {
        var flatCoordinates =
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        _ol_geom_flat_reverse_.coordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql(
            [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4]);
      });

    });

  });

});
