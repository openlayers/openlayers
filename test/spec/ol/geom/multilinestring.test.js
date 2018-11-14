import {isEmpty} from '../../../../src/ol/extent.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';


describe('ol.geom.MultiLineString', function() {

  it('cannot be constructed with a null geometry', function() {
    expect(function() {
      return new MultiLineString(null);
    }).to.throwException();
  });

  describe('construct empty', function() {

    let multiLineString;
    beforeEach(function() {
      multiLineString = new MultiLineString([]);
    });

    it('defaults to layout XY', function() {
      expect(multiLineString.getLayout()).to.be('XY');
    });

    it('has empty coordinates', function() {
      expect(multiLineString.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function() {
      expect(isEmpty(multiLineString.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(2);
    });

    it('can append line strings', function() {
      multiLineString.appendLineString(
        new LineString([[1, 2], [3, 4]]));
      expect(multiLineString.getCoordinates()).to.eql(
        [[[1, 2], [3, 4]]]);
      multiLineString.appendLineString(
        new LineString([[5, 6], [7, 8]]));
      expect(multiLineString.getCoordinates()).to.eql(
        [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

  describe('construct with 2D coordinates', function() {

    let multiLineString;
    beforeEach(function() {
      multiLineString = new MultiLineString(
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

    let multiLineString;
    beforeEach(function() {
      multiLineString = new MultiLineString(
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

    let multiLineString;
    beforeEach(function() {
      multiLineString = new MultiLineString(
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
      const lineString0 = multiLineString.getLineString(0);
      expect(lineString0).to.be.an(LineString);
      expect(lineString0.getLayout()).to.be('XYM');
      expect(lineString0.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
      const lineString1 = multiLineString.getLineString(1);
      expect(lineString1).to.be.an(LineString);
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

    let multiLineString;
    beforeEach(function() {
      multiLineString = new MultiLineString(
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
      const geom = new MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[-100, -200], [100, 200]], [[50, -100], [-50, 100]]]);
    });

    it('accepts sx and sy', function() {
      const geom = new MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[-20, -60], [20, 60]], [[10, -30], [-10, 30]]]);
    });

    it('accepts an anchor', function() {
      const geom = new MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(3, 2, [10, 20]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([[[-50, -60], [10, 20]], [[-5, -40], [-35, 0]]]);
    });

  });

  describe('#setLineStrings', function() {

    it('sets the line strings', function() {
      const lineString1 = new LineString([[1, 2], [3, 4]]);
      const lineString2 = new LineString([[5, 6], [7, 8]]);
      const multiLineString = new MultiLineString([lineString1, lineString2]);
      expect(multiLineString.getFlatCoordinates()).to.eql(
        [1, 2, 3, 4, 5, 6, 7, 8]);
      expect(multiLineString.getEnds()).to.eql([4, 8]);
      const coordinates = multiLineString.getCoordinates();
      expect(coordinates[0]).to.eql(lineString1.getCoordinates());
      expect(coordinates[1]).to.eql(lineString2.getCoordinates());
    });
  });

  describe('#containsXY()', function() {

    let multiLineString;
    beforeEach(function() {
      multiLineString = new MultiLineString(
        [[[1, 2, 3], [4, 5, 6]], [[-1, -1, 9], [2, 2, 12]]]);
    });

    it('does contain XY', function() {
      expect(multiLineString.containsXY(1, 2)).to.be(true);
      expect(multiLineString.containsXY(4, 5)).to.be(true);
      expect(multiLineString.containsXY(3, 4)).to.be(true);

      expect(multiLineString.containsXY(-1, -1)).to.be(true);
      expect(multiLineString.containsXY(2, 2)).to.be(true);
      expect(multiLineString.containsXY(0, 0)).to.be(true);
    });

    it('does not contain XY', function() {
      expect(multiLineString.containsXY(1, 3)).to.be(false);
      expect(multiLineString.containsXY(2, 11)).to.be(false);
      expect(multiLineString.containsXY(-2, 3)).to.be(false);
    });

  });

});
