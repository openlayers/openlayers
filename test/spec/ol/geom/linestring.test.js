import {isEmpty} from '../../../../src/ol/extent.js';
import LineString from '../../../../src/ol/geom/LineString.js';


describe('ol.geom.LineString', () => {

  test('cannot be constructed with a null geometry', () => {
    expect(function() {
      return new LineString(null);
    }).toThrow();
  });

  describe('construct empty', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString([]);
    });

    test('defaults to layout XY', () => {
      expect(lineString.getLayout()).toBe('XY');
    });

    test('has empty coordinates', () => {
      expect(lineString.getCoordinates()).toHaveLength(0);
    });

    test('has an empty extent', () => {
      expect(isEmpty(lineString.getExtent())).toBe(true);
    });

    test('has empty flat coordinates', () => {
      expect(lineString.getFlatCoordinates()).toHaveLength(0);
    });

    test('has stride the expected stride', () => {
      expect(lineString.getStride()).toBe(2);
    });

    test('can append coordinates', () => {
      lineString.appendCoordinate([1, 2]);
      expect(lineString.getCoordinates()).toEqual([[1, 2]]);
      lineString.appendCoordinate([3, 4]);
      expect(lineString.getCoordinates()).toEqual([[1, 2], [3, 4]]);
    });

  });

  describe('construct with 2D coordinates', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString([[1, 2], [3, 4]]);
    });

    test('has the expected layout', () => {
      expect(lineString.getLayout()).toBe('XY');
    });

    test('has the expected coordinates', () => {
      expect(lineString.getCoordinates()).toEqual([[1, 2], [3, 4]]);
    });

    test('has the expected extent', () => {
      expect(lineString.getExtent()).toEqual([1, 2, 3, 4]);
    });

    test('has the expected flat coordinates', () => {
      expect(lineString.getFlatCoordinates()).toEqual([1, 2, 3, 4]);
    });

    test('has stride the expected stride', () => {
      expect(lineString.getStride()).toBe(2);
    });

    describe('#intersectsExtent', () => {

      test('return false for non matching extent', () => {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).toBe(false);
      });

      test('return true for extent on midpoint', () => {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).toBe(true);
      });

      test('returns true for the geom\'s own extent', () => {
        expect(lineString.intersectsExtent(lineString.getExtent())).toBe(true);
      });

    });

    describe('#getCoordinateAt', () => {

      test('return the first point when fraction is 0', () => {
        expect(lineString.getCoordinateAt(0)).toEqual([1, 2]);
      });

      test('return the last point when fraction is 1', () => {
        expect(lineString.getCoordinateAt(1)).toEqual([3, 4]);
      });

      test('return the mid point when fraction is 0.5', () => {
        expect(lineString.getCoordinateAt(0.5)).toEqual([2, 3]);
      });

    });

  });

  describe('construct with 3D coordinates', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString([[1, 2, 3], [4, 5, 6]]);
    });

    test('has the expected layout', () => {
      expect(lineString.getLayout()).toBe('XYZ');
    });

    test('has the expected coordinates', () => {
      expect(lineString.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    test('has the expected extent', () => {
      expect(lineString.getExtent()).toEqual([1, 2, 4, 5]);
    });

    test('has the expected flat coordinates', () => {
      expect(lineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('has the expected stride', () => {
      expect(lineString.getStride()).toBe(3);
    });

    describe('#intersectsExtent', () => {

      test('return false for non matching extent', () => {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).toBe(false);
      });

      test('return true for extent on midpoint', () => {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).toBe(true);
      });

      test('returns true for the geom\'s own extent', () => {
        expect(lineString.intersectsExtent(lineString.getExtent())).toBe(true);
      });

    });

  });

  describe('construct with 3D coordinates and layout XYM', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString(
        [[1, 2, 3], [4, 5, 6]], 'XYM');
    });

    test('has the expected layout', () => {
      expect(lineString.getLayout()).toBe('XYM');
    });

    test('has the expected coordinates', () => {
      expect(lineString.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    test('has the expected extent', () => {
      expect(lineString.getExtent()).toEqual([1, 2, 4, 5]);
    });

    test('has the expected flat coordinates', () => {
      expect(lineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('has the expected stride', () => {
      expect(lineString.getStride()).toBe(3);
    });

    describe('#intersectsExtent', () => {

      test('return false for non matching extent', () => {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).toBe(false);
      });

      test('return true for extent on midpoint', () => {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).toBe(true);
      });

      test('returns true for the geom\'s own extent', () => {
        expect(lineString.intersectsExtent(lineString.getExtent())).toBe(true);
      });

    });

  });

  describe('construct with 4D coordinates', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    test('has the expected layout', () => {
      expect(lineString.getLayout()).toBe('XYZM');
    });

    test('has the expected coordinates', () => {
      expect(lineString.getCoordinates()).toEqual([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    test('has the expected extent', () => {
      expect(lineString.getExtent()).toEqual([1, 2, 5, 6]);
    });

    test('has the expected flat coordinates', () => {
      expect(lineString.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('has the expected stride', () => {
      expect(lineString.getStride()).toBe(4);
    });

    describe('#intersectsExtent', () => {

      test('return false for non matching extent', () => {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).toBe(false);
      });

      test('return true for extent on midpoint', () => {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).toBe(true);
      });

      test('returns true for the geom\'s own extent', () => {
        expect(lineString.intersectsExtent(lineString.getExtent())).toBe(true);
      });

    });

  });

  describe('#scale()', () => {

    test('scales a linestring', () => {
      const geom = new LineString([[-10, -20], [10, 20]]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[-100, -200], [100, 200]]);
    });

    test('accepts sx and sy', () => {
      const geom = new LineString([[-10, -20], [10, 20]]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[-20, -60], [20, 60]]);
    });

    test('accepts an anchor', () => {
      const geom = new LineString([[-10, -20], [10, 20]]);
      geom.scale(3, 2, [10, 20]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[-50, -60], [10, 20]]);
    });

  });

  describe('with a simple line string', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString(
        [[0, 0], [1.5, 1], [3, 3], [5, 1], [6, 3.5], [7, 5]]);
    });

    describe('#getFirstCoordinate', () => {

      test('returns the expected result', () => {
        expect(lineString.getFirstCoordinate()).toEqual([0, 0]);
      });

    });

    describe('#getFlatMidpoint', () => {

      test('returns the expected result', () => {
        const midpoint = lineString.getFlatMidpoint();
        expect(midpoint).toBeInstanceOf(Array);
        expect(midpoint).toHaveLength(2);
        expect(midpoint[0]).to.roughlyEqual(4, 1e-1);
        expect(midpoint[1]).to.roughlyEqual(2, 1e-1);
      });

    });

    describe('#getLastCoordinate', () => {

      test('returns the expected result', () => {
        expect(lineString.getLastCoordinate()).toEqual([7, 5]);
      });

    });

    describe('#simplify', () => {

      test('returns a simplified geometry', () => {
        const simplified = lineString.simplify(1);
        expect(simplified).toBeInstanceOf(LineString);
        expect(simplified.getCoordinates()).toEqual([[0, 0], [3, 3], [5, 1], [7, 5]]);
      });

      test('does not modify the original', () => {
        lineString.simplify(1);
        expect(lineString.getCoordinates()).toEqual([[0, 0], [1.5, 1], [3, 3], [5, 1], [6, 3.5], [7, 5]]);
      });

      test('delegates to the internal method', () => {
        const simplified = lineString.simplify(2);
        const internal = lineString.getSimplifiedGeometry(4);
        expect(simplified.getCoordinates()).toEqual(internal.getCoordinates());
      });

    });

    describe('#getSimplifiedGeometry', () => {

      test('returns the expectedResult', () => {
        const simplifiedGeometry = lineString.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).toBeInstanceOf(LineString);
        expect(simplifiedGeometry.getCoordinates()).toEqual([[0, 0], [3, 3], [5, 1], [7, 5]]);
      });

      test('remembers the minimum squared tolerance', () => {
        sinon.spy(lineString, 'getSimplifiedGeometryInternal');
        const simplifiedGeometry1 = lineString.getSimplifiedGeometry(0.05);
        expect(lineString.getSimplifiedGeometryInternal.callCount).toBe(1);
        expect(simplifiedGeometry1).toBe(lineString);
        const simplifiedGeometry2 = lineString.getSimplifiedGeometry(0.01);
        expect(lineString.getSimplifiedGeometryInternal.callCount).toBe(1);
        expect(simplifiedGeometry2).toBe(lineString);
      });

    });

    describe('#getCoordinateAt', () => {

      test('return the first point when fraction is 0', () => {
        expect(lineString.getCoordinateAt(0)).toEqual([0, 0]);
      });

      test('return the last point when fraction is 1', () => {
        expect(lineString.getCoordinateAt(1)).toEqual([7, 5]);
      });

      test('return the mid point when fraction is 0.5', () => {
        const midpoint = lineString.getFlatMidpoint();
        expect(lineString.getCoordinateAt(0.5)).toEqual(midpoint);
      });

    });

  });

  describe('with a simple XYM coordinates', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString(
        [[1, 2, 3], [4, 5, 6]], 'XYM');
    });

    describe('#getCoordinateAtM', () => {

      test('returns the expected value', () => {
        expect(lineString.getCoordinateAtM(2, false)).toBe(null);
        expect(lineString.getCoordinateAtM(2, true)).toEqual([1, 2, 2]);
        expect(lineString.getCoordinateAtM(3, false)).toEqual([1, 2, 3]);
        expect(lineString.getCoordinateAtM(3, true)).toEqual([1, 2, 3]);
        expect(lineString.getCoordinateAtM(4, false)).toEqual([2, 3, 4]);
        expect(lineString.getCoordinateAtM(4, true)).toEqual([2, 3, 4]);
        expect(lineString.getCoordinateAtM(5, false)).toEqual([3, 4, 5]);
        expect(lineString.getCoordinateAtM(5, true)).toEqual([3, 4, 5]);
        expect(lineString.getCoordinateAtM(6, false)).toEqual([4, 5, 6]);
        expect(lineString.getCoordinateAtM(6, true)).toEqual([4, 5, 6]);
        expect(lineString.getCoordinateAtM(7, false)).toEqual(null);
        expect(lineString.getCoordinateAtM(7, true)).toEqual([4, 5, 7]);
      });

    });

  });

  describe('with several XYZM coordinates', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString([
        [0, 0, 0, 0],
        [1, -1, 2, 1],
        [2, -2, 4, 2],
        [4, -4, 8, 4],
        [8, -8, 16, 8],
        [12, -12, 24, 12],
        [14, -14, 28, 14],
        [15, -15, 30, 15],
        [16, -16, 32, 16],
        [18, -18, 36, 18],
        [22, -22, 44, 22]
      ]);
    });

    describe('#getCoordinateAtM', () => {

      test('returns the expected value', () => {
        expect(lineString.getLayout()).toBe('XYZM');
        let m;
        for (m = 0; m <= 22; m += 0.5) {
          expect(lineString.getCoordinateAtM(m, true)).toEqual([m, -m, 2 * m, m]);
        }
      });

    });

  });

  describe('#containsXY()', () => {

    let lineString;
    beforeEach(() => {
      lineString = new LineString([
        [0, 0, 0, 0],
        [1, -1, 2, 1],
        [2, -2, 4, 2],
        [4, -4, 8, 4],
        [8, -8, 16, 8],
        [12, -12, 24, 12],
        [14, -14, 28, 14],
        [15, -15, 30, 15],
        [16, -16, 32, 16],
        [18, -18, 36, 18],
        [22, -22, 44, 22]
      ]);
    });

    test('does contain XY', () => {
      expect(lineString.containsXY(1, -1)).toBe(true);
      expect(lineString.containsXY(16, -16)).toBe(true);
      expect(lineString.containsXY(3, -3)).toBe(true);
    });

    test('does not contain XY', () => {
      expect(lineString.containsXY(1, 3)).toBe(false);
      expect(lineString.containsXY(2, 2)).toBe(false);
      expect(lineString.containsXY(2, 3)).toBe(false);
    });

  });

});
