import {isEmpty} from '../../../../src/ol/extent.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../src/ol/geom/Point.js';


describe('ol.geom.MultiPoint', () => {

  test('cannot be constructed with a null geometry', () => {
    expect(function() {
      return new MultiPoint(null);
    }).toThrow();
  });

  describe('construct empty', () => {

    let multiPoint;
    beforeEach(() => {
      multiPoint = new MultiPoint([]);
    });

    test('defaults to layout XY', () => {
      expect(multiPoint.getLayout()).toBe('XY');
    });

    test('has empty coordinates', () => {
      expect(multiPoint.getCoordinates()).toHaveLength(0);
    });

    test('has an empty extent', () => {
      expect(isEmpty(multiPoint.getExtent())).toBe(true);
    });

    test('has empty flat coordinates', () => {
      expect(multiPoint.getFlatCoordinates()).toHaveLength(0);
    });

    test('has stride the expected stride', () => {
      expect(multiPoint.getStride()).toBe(2);
    });

    test('can append points', () => {
      multiPoint.appendPoint(new Point([1, 2]));
      expect(multiPoint.getCoordinates()).toEqual([[1, 2]]);
      multiPoint.appendPoint(new Point([3, 4]));
      expect(multiPoint.getCoordinates()).toEqual([[1, 2], [3, 4]]);
    });

  });

  describe('construct with 2D coordinates', () => {

    let multiPoint;
    beforeEach(() => {
      multiPoint = new MultiPoint([[1, 2], [3, 4]]);
    });

    test('has the expected layout', () => {
      expect(multiPoint.getLayout()).toBe('XY');
    });

    test('has the expected coordinates', () => {
      expect(multiPoint.getCoordinates()).toEqual([[1, 2], [3, 4]]);
    });

    test('has the expected extent', () => {
      expect(multiPoint.getExtent()).toEqual([1, 2, 3, 4]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiPoint.getFlatCoordinates()).toEqual([1, 2, 3, 4]);
    });

    test('has stride the expected stride', () => {
      expect(multiPoint.getStride()).toBe(2);
    });

    describe('#intersectsExtent()', () => {

      test('returns true for extent covering a point', () => {
        expect(multiPoint.intersectsExtent([1, 2, 2, 2])).toBe(true);
      });

      test('returns false for non-matching extent within own extent', () => {
        expect(multiPoint.intersectsExtent([2, 3, 2, 4])).toBe(false);
      });

    });

  });

  describe('construct with 3D coordinates', () => {

    let multiPoint;
    beforeEach(() => {
      multiPoint = new MultiPoint([[1, 2, 3], [4, 5, 6]]);
    });

    test('has the expected layout', () => {
      expect(multiPoint.getLayout()).toBe('XYZ');
    });

    test('has the expected coordinates', () => {
      expect(multiPoint.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    test('has the expected extent', () => {
      expect(multiPoint.getExtent()).toEqual([1, 2, 4, 5]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiPoint.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('has the expected stride', () => {
      expect(multiPoint.getStride()).toBe(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', () => {

    let multiPoint;
    beforeEach(() => {
      multiPoint = new MultiPoint(
        [[1, 2, 3], [4, 5, 6]], 'XYM');
    });

    test('has the expected layout', () => {
      expect(multiPoint.getLayout()).toBe('XYM');
    });

    test('has the expected coordinates', () => {
      expect(multiPoint.getCoordinates()).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    test('has the expected extent', () => {
      expect(multiPoint.getExtent()).toEqual([1, 2, 4, 5]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiPoint.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('has the expected stride', () => {
      expect(multiPoint.getStride()).toBe(3);
    });

    test('can return individual points', () => {
      const point0 = multiPoint.getPoint(0);
      expect(point0.getLayout()).toBe('XYM');
      expect(point0.getCoordinates()).toEqual([1, 2, 3]);
      const point1 = multiPoint.getPoint(1);
      expect(point1.getLayout()).toBe('XYM');
      expect(point1.getCoordinates()).toEqual([4, 5, 6]);
    });

    test('can return all points', () => {
      const points = multiPoint.getPoints();
      expect(points).toHaveLength(2);
      expect(points[0]).toBeInstanceOf(Point);
      expect(points[0].getLayout()).toBe('XYM');
      expect(points[0].getCoordinates()).toEqual([1, 2, 3]);
      expect(points[1]).toBeInstanceOf(Point);
      expect(points[1].getLayout()).toBe('XYM');
      expect(points[1].getCoordinates()).toEqual([4, 5, 6]);
    });

  });

  describe('construct with 4D coordinates', () => {

    let multiPoint;
    beforeEach(() => {
      multiPoint = new MultiPoint([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    test('has the expected layout', () => {
      expect(multiPoint.getLayout()).toBe('XYZM');
    });

    test('has the expected coordinates', () => {
      expect(multiPoint.getCoordinates()).toEqual([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    test('has the expected extent', () => {
      expect(multiPoint.getExtent()).toEqual([1, 2, 5, 6]);
    });

    test('has the expected flat coordinates', () => {
      expect(multiPoint.getFlatCoordinates()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('has the expected stride', () => {
      expect(multiPoint.getStride()).toBe(4);
    });

    describe('#getClosestPoint', () => {

      test('preserves extra dimensions', () => {
        const closestPoint = multiPoint.getClosestPoint([6, 6]);
        expect(closestPoint).toEqual([5, 6, 7, 8]);
      });

    });

  });

  describe('#scale()', () => {

    test('scales a multi-point', () => {
      const geom = new MultiPoint([[-10, -20], [10, 20]]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[-100, -200], [100, 200]]);
    });

    test('accepts sx and sy', () => {
      const geom = new MultiPoint([[-10, -20], [10, 20]]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[-20, -60], [20, 60]]);
    });

    test('accepts an anchor', () => {
      const geom = new MultiPoint([[-10, -20], [10, 20]]);
      geom.scale(3, 2, [-10, -20]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[-10, -20], [50, 60]]);
    });

  });

  describe('#applyTransform()', () => {

    let multi, transform;
    beforeEach(() => {
      multi = new MultiPoint([[1, 2], [3, 4]]);
      transform = sinon.spy();
    });

    test('calls a transform function', () => {
      multi.applyTransform(transform);
      expect(transform.calledOnce).toBe(true);
      const args = transform.firstCall.args;
      expect(args).toHaveLength(3);

      expect(args[0]).toBe(multi.getFlatCoordinates());
      expect(args[1]).toBe(multi.getFlatCoordinates());
      expect(args[2]).toBe(2);
    });

    test('allows for modification of coordinates', () => {
      const mod = function(input, output, dimension) {
        const copy = input.slice();
        for (let i = 0, ii = copy.length; i < ii; i += dimension) {
          output[i] = copy[i + 1];
          output[i + 1] = copy[i];
        }
      };
      multi.applyTransform(mod);
      expect(multi.getCoordinates()).toEqual([[2, 1], [4, 3]]);
    });

    test('returns undefined', () => {
      const got = multi.applyTransform(transform);
      expect(got).toBe(undefined);
    });

  });

  describe('#transform()', () => {

    test('transforms a geometry given CRS identifiers', () => {
      const multi = new MultiPoint([[-111, 45], [111, -45]]).transform(
        'EPSG:4326', 'EPSG:3857');

      expect(multi).toBeInstanceOf(MultiPoint);

      const coords = multi.getCoordinates();

      expect(coords[0][0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[0][1]).to.roughlyEqual(5621521.48, 1e-2);

      expect(coords[1][0]).to.roughlyEqual(12356463.47, 1e-2);
      expect(coords[1][1]).to.roughlyEqual(-5621521.48, 1e-2);
    });

  });

  describe('#containsXY()', () => {

    test('does contain XY', () => {
      const multi = new MultiPoint([[1, 2], [10, 20]]);

      expect(multi.containsXY(1, 2)).toBe(true);
      expect(multi.containsXY(10, 20)).toBe(true);
    });

    test('does not contain XY', () => {
      const multi = new MultiPoint([[1, 2], [10, 20]]);

      expect(multi.containsXY(1, 3)).toBe(false);
      expect(multi.containsXY(2, 2)).toBe(false);
      expect(multi.containsXY(2, 3)).toBe(false);

      expect(multi.containsXY(10, 30)).toBe(false);
      expect(multi.containsXY(20, 20)).toBe(false);
      expect(multi.containsXY(20, 30)).toBe(false);
    });

  });

});
