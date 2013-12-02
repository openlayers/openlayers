goog.provide('ol.test.geom.flat');


describe('ol.geom.flat', function() {

  describe('ol.geom.flat.deflateCoordinates', function() {

    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens coordinates', function() {
      var offset = ol.geom.flat.deflateCoordinates(
          flatCoordinates, 0, [[1, 2], [3, 4]], 2);
      expect(offset).to.be(4);
      expect(flatCoordinates).to.eql([1, 2, 3, 4]);
    });

  });

  describe('ol.geom.flat.deflateCoordinatess', function() {

    var flatCoordinates;
    beforeEach(function() {
      flatCoordinates = [];
    });

    it('flattens arrays of coordinates', function() {
      var ends = ol.geom.flat.deflateCoordinatess(flatCoordinates, 0,
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], 2);
      expect(ends).to.eql([4, 8]);
      expect(flatCoordinates).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

  });

  describe('ol.geom.flat.flipXY', function() {

    it('can flip XY coordinates', function() {
      var flatCoordinates = ol.geom.flat.flipXY([1, 2, 3, 4], 0, 4, 2);
      expect(flatCoordinates).to.eql([2, 1, 4, 3]);
    });

    it('can flip XY coordinates while preserving other dimensions', function() {
      var flatCoordinates = ol.geom.flat.flipXY(
          [1, 2, 3, 4, 5, 6, 7, 8], 0, 8, 4);
      expect(flatCoordinates).to.eql([2, 1, 3, 4, 6, 5, 7, 8]);
    });

    it('can flip XY coordinates in place', function() {
      var flatCoordinates = [1, 2, 3, 4];
      expect(ol.geom.flat.flipXY(flatCoordinates, 0, 4, 2, flatCoordinates)).
          to.be(flatCoordinates);
      expect(flatCoordinates).to.eql([2, 1, 4, 3]);
    });

    it('can flip XY coordinates in place while preserving other dimensions',
        function() {
          var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          expect(ol.geom.flat.flipXY(
              flatCoordinates, 0, 9, 3, flatCoordinates)).
              to.be(flatCoordinates);
          expect(flatCoordinates).to.eql([2, 1, 3, 5, 4, 6, 8, 7, 9]);
        });

  });

  describe('ol.geom.flat.inflateCoordinates', function() {

    it('inflates coordinates', function() {
      var coordinates = ol.geom.flat.inflateCoordinates([1, 2, 3, 4], 0, 4, 2);
      expect(coordinates).to.eql([[1, 2], [3, 4]]);
    });

  });

  describe('ol.geom.flat.inflateCoordinatess', function() {

    it('inflates arrays of coordinates', function() {
      var coordinatess = ol.geom.flat.inflateCoordinatess(
          [1, 2, 3, 4, 5, 6, 7, 8], 0, [4, 8], 2);
      expect(coordinatess).to.eql([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

  describe('ol.geom.flat.lineStringInterpolate', function() {

    it('returns the expected value for single points', function() {
      var flatCoordinates = [0, 1];
      var point =
          ol.geom.flat.lineStringInterpolate(flatCoordinates, 0, 2, 2, 0.5);
      expect(point).to.eql([0, 1]);
    });

    it('returns the expected value for simple line segments', function() {
      var flatCoordinates = [0, 1, 2, 3];
      var point =
          ol.geom.flat.lineStringInterpolate(flatCoordinates, 0, 4, 2, 0.5);
      expect(point).to.eql([1, 2]);
    });

    it('returns the expected value when the mid point is an existing ' +
       'coordinate', function() {
          var flatCoordinates = [0, 1, 2, 3, 4, 5];
          var point =
              ol.geom.flat.lineStringInterpolate(flatCoordinates, 0, 6, 2, 0.5);
          expect(point).to.eql([2, 3]);
        });

    it('returns the expected value when the midpoint falls halfway between ' +
       'two existing coordinates', function() {
          var flatCoordinates = [0, 1, 2, 3, 4, 5, 6, 7];
          var point =
              ol.geom.flat.lineStringInterpolate(flatCoordinates, 0, 8, 2, 0.5);
          expect(point).to.eql([3, 4]);
        });

    it('returns the expected value when the coordinates are not evenly spaced',
        function() {
          var flatCoordinates = [0, 1, 2, 3, 6, 7];
          var point =
              ol.geom.flat.lineStringInterpolate(flatCoordinates, 0, 6, 2, 0.5);
          expect(point).to.eql([3, 4]);
        });

  });

  describe('ol.geom.flat.linearRingIsClockwise', function() {

    it('identifies clockwise rings', function() {
      var flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0];
      var isClockwise = ol.geom.flat.linearRingIsClockwise(
          flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).to.be(true);
    });

    it('identifies anti-clockwise rings', function() {
      var flatCoordinates = [2, 2, 3, 2, 3, 3, 2, 3];
      var isClockwise = ol.geom.flat.linearRingIsClockwise(
          flatCoordinates, 0, flatCoordinates.length, 2);
      expect(isClockwise).to.be(false);
    });

  });

  describe('ol.geom.flat.reverseCoordinates', function() {

    describe('with a stride of 2', function() {

      it('can reverse empty flat coordinates', function() {
        var flatCoordinates = [];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.be.empty();
      });

      it('can reverse one flat coordinates', function() {
        var flatCoordinates = [1, 2];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([1, 2]);
      });

      it('can reverse two flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([3, 4, 1, 2]);
      });

      it('can reverse three flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([5, 6, 3, 4, 1, 2]);
      });

      it('can reverse four flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 2);
        expect(flatCoordinates).to.eql([7, 8, 5, 6, 3, 4, 1, 2]);
      });

    });

    describe('with a stride of 3', function() {

      it('can reverse empty flat coordinates', function() {
        var flatCoordinates = [];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.be.empty();
      });

      it('can reverse one flat coordinates', function() {
        var flatCoordinates = [1, 2, 3];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([1, 2, 3]);
      });

      it('can reverse two flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([4, 5, 6, 1, 2, 3]);
      });

      it('can reverse three flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

      it('can reverse four flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 3);
        expect(flatCoordinates).to.eql([10, 11, 12, 7, 8, 9, 4, 5, 6, 1, 2, 3]);
      });

    });

    describe('with a stride of 4', function() {

      it('can reverse empty flat coordinates', function() {
        var flatCoordinates = [];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.be.empty();
      });

      it('can reverse one flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql([1, 2, 3, 4]);
      });

      it('can reverse two flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql([5, 6, 7, 8, 1, 2, 3, 4]);
      });

      it('can reverse three flat coordinates', function() {
        var flatCoordinates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql([9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4]);
      });

      it('can reverse four flat coordinates', function() {
        var flatCoordinates =
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        ol.geom.flat.reverseCoordinates(
            flatCoordinates, 0, flatCoordinates.length, 4);
        expect(flatCoordinates).to.eql(
            [13, 14, 15, 16, 9, 10, 11, 12, 5, 6, 7, 8, 1, 2, 3, 4]);
      });

    });

  });

});


goog.require('ol.geom.flat');
