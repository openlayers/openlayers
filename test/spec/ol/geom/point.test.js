import Point from '../../../../src/ol/geom/Point.js';


describe('ol.geom.Point', () => {

  test('cannot be constructed with a null geometry', () => {
    expect(function() {
      return new Point(null);
    }).toThrow();
  });

  describe('construct with 2D coordinates', () => {

    let point;
    beforeEach(() => {
      point = new Point([1, 2]);
    });

    test('has the expected layout', () => {
      expect(point.getLayout()).toBe('XY');
    });

    test('has the expected coordinates', () => {
      expect(point.getCoordinates()).toEqual([1, 2]);
    });

    test('has the expected extent', () => {
      expect(point.getExtent()).toEqual([1, 2, 1, 2]);
    });

    test('has the expected flat coordinates', () => {
      expect(point.getFlatCoordinates()).toEqual([1, 2]);
    });

    test('has stride the expected stride', () => {
      expect(point.getStride()).toBe(2);
    });

    test('does not intersect non matching extent', () => {
      expect(point.intersectsExtent([0, 0, 10, 0.5])).toBe(false);
    });

    test('does intersect it\'s extent', () => {
      expect(point.intersectsExtent(point.getExtent())).toBe(true);
    });

  });

  describe('construct with 3D coordinates and layout XYM', () => {

    let point;
    beforeEach(() => {
      point = new Point([1, 2, 3], 'XYM');
    });

    test('has the expected layout', () => {
      expect(point.getLayout()).toBe('XYM');
    });

    test('has the expected coordinates', () => {
      expect(point.getCoordinates()).toEqual([1, 2, 3]);
    });

    test('has the expected extent', () => {
      expect(point.getExtent()).toEqual([1, 2, 1, 2]);
    });

    test('has the expected flat coordinates', () => {
      expect(point.getFlatCoordinates()).toEqual([1, 2, 3]);
    });

    test('has the expected stride', () => {
      expect(point.getStride()).toBe(3);
    });

    test('does not intersect non matching extent', () => {
      expect(point.intersectsExtent([0, 0, 10, 0.5])).toBe(false);
    });

    test('does intersect it\'s extent', () => {
      expect(point.intersectsExtent(point.getExtent())).toBe(true);
    });

  });

  describe('construct with 4D coordinates', () => {

    let point;
    beforeEach(() => {
      point = new Point([1, 2, 3, 4]);
    });

    test('has the expected layout', () => {
      expect(point.getLayout()).toBe('XYZM');
    });

    test('has the expected coordinates', () => {
      expect(point.getCoordinates()).toEqual([1, 2, 3, 4]);
    });

    test('has the expected extent', () => {
      expect(point.getExtent()).toEqual([1, 2, 1, 2]);
    });

    test('has the expected flat coordinates', () => {
      expect(point.getFlatCoordinates()).toEqual([1, 2, 3, 4]);
    });

    test('has the expected stride', () => {
      expect(point.getStride()).toBe(4);
    });

    test('does not intersect non matching extent', () => {
      expect(point.intersectsExtent([0, 0, 10, 0.5])).toBe(false);
    });

    test('does intersect it\'s extent', () => {
      expect(point.intersectsExtent(point.getExtent())).toBe(true);
    });

    describe('#getClosestPoint', () => {

      test('preseves extra dimensions', () => {
        const closestPoint = point.getClosestPoint([0, 0]);
        expect(closestPoint).toEqual([1, 2, 3, 4]);
      });

    });

  });

  describe('#scale()', () => {

    test('scales a point', () => {
      const geom = new Point([1, 2]);
      geom.scale(10e6);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([1, 2]);
    });

    test('accepts sx and sy', () => {
      const geom = new Point([1, 2]);
      geom.scale(1e6, -42);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([1, 2]);
    });

    test('accepts an anchor', () => {
      const geom = new Point([1, 2]);
      geom.scale(10, 15, [0, 0]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([10, 30]);
    });

  });

  describe('#applyTransform()', () => {

    let point, transform;
    beforeEach(() => {
      point = new Point([1, 2]);
      transform = sinon.spy();
    });

    test('calls a transform function', () => {
      point.applyTransform(transform);
      expect(transform.calledOnce).toBe(true);
      const args = transform.firstCall.args;
      expect(args).toHaveLength(3);

      expect(args[0]).toBe(point.getFlatCoordinates());
      expect(args[1]).toBe(point.getFlatCoordinates());
      expect(args[2]).toBe(2);
    });

    test('allows for modification of coordinates', () => {
      const mod = function(input, output, dimension) {
        const copy = input.slice();
        output[1] = copy[0];
        output[0] = copy[1];
      };
      point.applyTransform(mod);
      expect(point.getCoordinates()).toEqual([2, 1]);
    });

    test('returns undefined', () => {
      const got = point.applyTransform(transform);
      expect(got).toBe(undefined);
    });

  });

  describe('#transform()', () => {

    test('transforms a geometry given CRS identifiers', () => {
      const point = new Point([-111, 45]).transform(
        'EPSG:4326', 'EPSG:3857');

      expect(point).toBeInstanceOf(Point);

      const coords = point.getCoordinates();

      expect(coords[0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[1]).to.roughlyEqual(5621521.48, 1e-2);
    });

    test('modifies the original', () => {
      const point = new Point([-111, 45]);
      point.transform('EPSG:4326', 'EPSG:3857');
      const coords = point.getCoordinates();

      expect(coords[0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[1]).to.roughlyEqual(5621521.48, 1e-2);
    });

  });

  describe('#containsXY()', () => {

    test('does contain XY', () => {
      const point = new Point([1, 2]);

      expect(point.containsXY(1, 2)).toBe(true);
    });

    test('does not contain XY', () => {
      const point = new Point([1, 2]);

      expect(point.containsXY(1, 3)).toBe(false);
      expect(point.containsXY(2, 2)).toBe(false);
      expect(point.containsXY(2, 3)).toBe(false);
    });

  });

});
