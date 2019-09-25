import {isEmpty} from '../../../../src/ol/extent.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';


describe('ol.geom.MultiLineString', () => {

  test('cannot be constructed with a null geometry', () => {
    expect(function() {
      return new MultiLineString(null);
    }).toThrow();
  });

  describe('construct empty', () => {

    let multiLineString;
    beforeEach(() => {
      multiLineString = new MultiLineString([]);
    });

    test('defaults to layout XY', () => {
      expect(multiLineString.getLayout()).toBe('XY');
    });

    test('has empty coordinates', () => {
      expect(multiLineString.getCoordinates()).toHaveLength(0);
    });

    test('has an empty extent', () => {
      expect(isEmpty(multiLineString.getExtent())).toBe(true);
    });

    test('has empty flat coordinates', () => {
      expect(multiLineString.getFlatCoordinates()).toHaveLength(0);
    });

    test('has stride the expected stride', () => {
      expect(multiLineString.getStride()).toBe(2);
    });

    test('can append line strings', () => {
      multiLineString.appendLineString(
        new LineString([[1, 2], [3, 4]]));
      expect(multiLineString.getCoordinates()).toEqual([[[1, 2], [3, 4]]]);
      multiLineString.appendLineString(
        new LineString([[5, 6], [7, 8]]));
      expect(multiLineString.getCoordinates()).toEqual([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

  });

  describe('construct with 2D coordinates', () => {

    let multiLineString;
    beforeEach(() => {
      multiLineString = new MultiLineString(
        [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    test('has the expected layout', () => {
      expect(multiLineString.getLayout()).toBe('XY');
    });

    test('has the expected coordinates', () => {
      expect(multiLineString.getCoordinates()).toEqual([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    test('has the expected extent', () => {
      expect(multiLineString.getExtent()).toEqual([1, 2, 7, 8]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiLineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('has stride the expected stride', () => {
      expect(multiLineString.getStride()).toBe(2);
    });

    describe('#getFlatMidpoints', () => {

      test('returns the expected result', () => {
        expect(multiLineString.getFlatMidpoints()).toEqual([2, 3, 6, 7]);
      });

    });

    describe('#intersectsExtent()', () => {

      test('returns true for intersecting part of lineString', () => {
        expect(multiLineString.intersectsExtent([1, 2, 2, 3])).toBe(true);
      });

      test('returns false for non-matching extent within own extent', () => {
        expect(multiLineString.intersectsExtent([1, 7, 2, 8])).toBe(false);
      });

    });

  });

  describe('construct with 3D coordinates', () => {

    let multiLineString;
    beforeEach(() => {
      multiLineString = new MultiLineString(
        [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    test('has the expected layout', () => {
      expect(multiLineString.getLayout()).toBe('XYZ');
    });

    test('has the expected coordinates', () => {
      expect(multiLineString.getCoordinates()).toEqual([[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    test('has the expected extent', () => {
      expect(multiLineString.getExtent()).toEqual([1, 2, 10, 11]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiLineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    test('has stride the expected stride', () => {
      expect(multiLineString.getStride()).toBe(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', () => {

    let multiLineString;
    beforeEach(() => {
      multiLineString = new MultiLineString(
        [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]],
        'XYM');
    });

    test('has the expected layout', () => {
      expect(multiLineString.getLayout()).toBe('XYM');
    });

    test('has the expected coordinates', () => {
      expect(multiLineString.getCoordinates()).toEqual([[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    test('has the expected extent', () => {
      expect(multiLineString.getExtent()).toEqual([1, 2, 10, 11]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiLineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    test('has stride the expected stride', () => {
      expect(multiLineString.getStride()).toBe(3);
    });

    test('can return individual line strings', () => {
      const lineString0 = multiLineString.getLineString(0);
      expect(lineString0).toBeInstanceOf(LineString);
      expect(lineString0.getLayout()).toBe('XYM');
      expect(lineString0.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
      const lineString1 = multiLineString.getLineString(1);
      expect(lineString1).toBeInstanceOf(LineString);
      expect(lineString1.getLayout()).toBe('XYM');
      expect(lineString1.getCoordinates()).toEqual([[7, 8, 9], [10, 11, 12]]);
    });

    describe('#getCoordinateAtM', () => {

      describe('with extrapolation and interpolation', () => {

        test('returns the expected value', () => {
          expect(multiLineString.getCoordinateAtM(0, true, true)).toEqual([1, 2, 0]);
          expect(multiLineString.getCoordinateAtM(3, true, true)).toEqual([1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, true, true)).toEqual([2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, true, true)).toEqual([4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, true, true)).toEqual([5.5, 6.5, 7.5]);
          expect(multiLineString.getCoordinateAtM(9, true, true)).toEqual([7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, true, true)).toEqual([8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, true, true)).toEqual([10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, true, true)).toEqual([10, 11, 15]);
        });

      });

      describe('with extrapolation and no interpolation', () => {

        test('returns the expected value', () => {
          expect(multiLineString.getCoordinateAtM(0, true, false)).toEqual([1, 2, 0]);
          expect(multiLineString.getCoordinateAtM(3, true, false)).toEqual([1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, true, false)).toEqual([2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, true, false)).toEqual([4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, true, false)).toBe(null);
          expect(multiLineString.getCoordinateAtM(9, true, false)).toEqual([7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, true, false)).toEqual([8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, true, false)).toEqual([10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, true, false)).toEqual([10, 11, 15]);
        });

      });

      describe('with no extrapolation and interpolation', () => {

        test('returns the expected value', () => {
          expect(multiLineString.getCoordinateAtM(0, false, true)).toEqual(null);
          expect(multiLineString.getCoordinateAtM(3, false, true)).toEqual([1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, false, true)).toEqual([2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, false, true)).toEqual([4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, false, true)).toEqual([5.5, 6.5, 7.5]);
          expect(multiLineString.getCoordinateAtM(9, false, true)).toEqual([7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, false, true)).toEqual([8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, false, true)).toEqual([10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, false, true)).toEqual(null);
        });

      });

      describe('with no extrapolation or interpolation', () => {

        test('returns the expected value', () => {
          expect(multiLineString.getCoordinateAtM(0, false, false)).toEqual(null);
          expect(multiLineString.getCoordinateAtM(3, false, false)).toEqual([1, 2, 3]);
          expect(multiLineString.getCoordinateAtM(4.5, false, false)).toEqual([2.5, 3.5, 4.5]);
          expect(multiLineString.getCoordinateAtM(6, false, false)).toEqual([4, 5, 6]);
          expect(multiLineString.getCoordinateAtM(7.5, false, false)).toEqual(null);
          expect(multiLineString.getCoordinateAtM(9, false, false)).toEqual([7, 8, 9]);
          expect(multiLineString.getCoordinateAtM(10.5, false, false)).toEqual([8.5, 9.5, 10.5]);
          expect(multiLineString.getCoordinateAtM(12, false, false)).toEqual([10, 11, 12]);
          expect(multiLineString.getCoordinateAtM(15, false, false)).toEqual(null);
        });

      });

    });

  });

  describe('construct with 4D coordinates', () => {

    let multiLineString;
    beforeEach(() => {
      multiLineString = new MultiLineString(
        [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    test('has the expected layout', () => {
      expect(multiLineString.getLayout()).toBe('XYZM');
    });

    test('has the expected coordinates', () => {
      expect(multiLineString.getCoordinates()).toEqual([[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    test('has the expected extent', () => {
      expect(multiLineString.getExtent()).toEqual([1, 2, 13, 14]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiLineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    test('has stride the expected stride', () => {
      expect(multiLineString.getStride()).toBe(4);
    });

  });

  describe('#scale()', () => {

    test('scales a multi-linestring', () => {
      const geom = new MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[-100, -200], [100, 200]], [[50, -100], [-50, 100]]]);
    });

    test('accepts sx and sy', () => {
      const geom = new MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[-20, -60], [20, 60]], [[10, -30], [-10, 30]]]);
    });

    test('accepts an anchor', () => {
      const geom = new MultiLineString([[[-10, -20], [10, 20]], [[5, -10], [-5, 10]]]);
      geom.scale(3, 2, [10, 20]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[-50, -60], [10, 20]], [[-5, -40], [-35, 0]]]);
    });

  });

  describe('#setLineStrings', () => {

    test('sets the line strings', () => {
      const lineString1 = new LineString([[1, 2], [3, 4]]);
      const lineString2 = new LineString([[5, 6], [7, 8]]);
      const multiLineString = new MultiLineString([lineString1, lineString2]);
      expect(multiLineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(multiLineString.getEnds()).toEqual([4, 8]);
      const coordinates = multiLineString.getCoordinates();
      expect(coordinates[0]).toEqual(lineString1.getCoordinates());
      expect(coordinates[1]).toEqual(lineString2.getCoordinates());
    });
  });

  describe('#containsXY()', () => {

    let multiLineString;
    beforeEach(() => {
      multiLineString = new MultiLineString(
        [[[1, 2, 3], [4, 5, 6]], [[-1, -1, 9], [2, 2, 12]]]);
    });

    test('does contain XY', () => {
      expect(multiLineString.containsXY(1, 2)).toBe(true);
      expect(multiLineString.containsXY(4, 5)).toBe(true);
      expect(multiLineString.containsXY(3, 4)).toBe(true);

      expect(multiLineString.containsXY(-1, -1)).toBe(true);
      expect(multiLineString.containsXY(2, 2)).toBe(true);
      expect(multiLineString.containsXY(0, 0)).toBe(true);
    });

    test('does not contain XY', () => {
      expect(multiLineString.containsXY(1, 3)).toBe(false);
      expect(multiLineString.containsXY(2, 11)).toBe(false);
      expect(multiLineString.containsXY(-2, 3)).toBe(false);
    });

  });

});
