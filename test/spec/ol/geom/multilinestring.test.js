goog.provide('ol.test.geom.MultiLineString');

goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');


describe('ol.geom.MultiLineString', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      return new ol.geom.MultiLineString(null);
    }).not.to.throwException();
  });

  describe('construct empty', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString([]);
    });

    it('defaults to layout XY', function() {
      expect(multiLineString.getLayout()).to.be('XY');
    });

    it('has empty coordinates', function() {
      expect(multiLineString.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function() {
      expect(ol.extent.isEmpty(multiLineString.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(2);
    });

    it('can append line strings', function() {
      multiLineString.appendLineString(
          new ol.geom.LineString([[1, 2], [3, 4]]));
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2], [3, 4]]]);
      multiLineString.appendLineString(
          new ol.geom.LineString([[5, 6], [7, 8]]));
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

  describe('construct with 2D coordinates', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be('XY');
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 7, 8]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(2);
    });

    describe('#getFlatMidpoints', function() {

      it('returns the expected result', function() {
        expect(multiLineString.getFlatMidpoints()).to.eql([2, 3, 6, 7]);
      });

    });

    describe('#intersectsExtent()', function() {

      it('returns true for intersecting part of lineString', function() {
        expect(multiLineString.intersectsExtent([1, 2, 2, 3])).to.be(true);
      });

      it('returns false for non-matching extent within own extent', function() {
        expect(multiLineString.intersectsExtent([1, 7, 2, 8])).to.be(false);
      });

    });

  });

  describe('construct with 3D coordinates', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be('XYZ');
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]],
          'XYM');
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be('XYM');
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(3);
    });

    it('can return individual line strings', function() {
      var lineString0 = multiLineString.getLineString(0);
      expect(lineString0).to.be.an(ol.geom.LineString);
      expect(lineString0.getLayout()).to.be('XYM');
      expect(lineString0.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
      var lineString1 = multiLineString.getLineString(1);
      expect(lineString1).to.be.an(ol.geom.LineString);
      expect(lineString1.getLayout()).to.be('XYM');
      expect(lineString1.getCoordinates()).to.eql([[7, 8, 9], [10, 11, 12]]);
    });

    describe('#getCoordinateAtM', function() {

      describe('with extrapolation and interpolation', function() {

        it('returns the expected value', function() {
          expect(multiLineString.getCoordinateAtM(0, true, true)).to.eql(
              [1, 2, 0]);
          expect(multiLineString.getCoordinateAtM(3, true, true)).to.eql(
              [1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, true, true)).to.eql(
              [2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, true, true)).to.eql(
              [4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, true, true)).to.eql(
              [5.5, 6.5, 7.5]);
          expect(multiLineString.getCoordinateAtM(9, true, true)).to.eql(
              [7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, true, true)).to.eql(
              [8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, true, true)).to.eql(
              [10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, true, true)).to.eql(
              [10, 11, 15]);
        });

      });

      describe('with extrapolation and no interpolation', function() {

        it('returns the expected value', function() {
          expect(multiLineString.getCoordinateAtM(0, true, false)).to.eql(
              [1, 2, 0]);
          expect(multiLineString.getCoordinateAtM(3, true, false)).to.eql(
              [1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, true, false)).to.eql(
              [2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, true, false)).to.eql(
              [4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, true, false)).to.be(
              null);
          expect(multiLineString.getCoordinateAtM(9, true, false)).to.eql(
              [7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, true, false)).to.eql(
              [8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, true, false)).to.eql(
              [10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, true, false)).to.eql(
              [10, 11, 15]);
        });

      });

      describe('with no extrapolation and interpolation', function() {

        it('returns the expected value', function() {
          expect(multiLineString.getCoordinateAtM(0, false, true)).to.eql(
              null);
          expect(multiLineString.getCoordinateAtM(3, false, true)).to.eql(
              [1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, false, true)).to.eql(
              [2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, false, true)).to.eql(
              [4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, false, true)).to.eql(
              [5.5, 6.5, 7.5]);
          expect(multiLineString.getCoordinateAtM(9, false, true)).to.eql(
              [7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, false, true)).to.eql(
              [8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, false, true)).to.eql(
              [10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, false, true)).to.eql(
              null);
        });

      });

      describe('with no extrapolation or interpolation', function() {

        it('returns the expected value', function() {
          expect(multiLineString.getCoordinateAtM(0, false, false)).to.eql(
              null);
          expect(multiLineString.getCoordinateAtM(3, false, false)).to.eql(
              [1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, false, false)).to.eql(
              [2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, false, false)).to.eql(
              [4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, false, false)).to.eql(
              null);
          expect(multiLineString.getCoordinateAtM(9, false, false)).to.eql(
              [7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, false, false)).to.eql(
              [8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, false, false)).to.eql(
              [10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, false, false)).to.eql(
              null);
        });

      });

    });

  });

  describe('construct with 4D coordinates', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be('XYZM');
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 13, 14]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(4);
    });

  });

  describe('#scale()', function() {

    it('scales a multi-linestring', function() {
      var geom = new ol.geom.MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(10);
      var coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[-100, -200], [100, 200]], [[50, -100], [-50, 100]]]);
    });

    it('accepts sx and sy', function() {
      var geom = new ol.geom.MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(2, 3);
      var coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[-20, -60], [20, 60]], [[10, -30], [-10, 30]]]);
    });

    it('accepts an anchor', function() {
      var geom = new ol.geom.MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(3, 2, [10, 20]);
      var coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[-50, -60], [10, 20]], [[-5, -40], [-35, 0]]]);
    });

  });

  describe('#setLineStrings', function() {

    it('sets the line strings', function() {
      var multiLineString = new ol.geom.MultiLineString(null);
      var lineString1 = new ol.geom.LineString([[1, 2], [3, 4]]);
      var lineString2 = new ol.geom.LineString([[5, 6], [7, 8]]);
      multiLineString.setLineStrings([lineString1, lineString2]);
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8]);
      expect(multiLineString.getEnds()).to.eql([4, 8]);
      var coordinates = multiLineString.getCoordinates();
      expect(coordinates[0]).to.eql(lineString1.getCoordinates());
      expect(coordinates[1]).to.eql(lineString2.getCoordinates());
    });
  });

});
