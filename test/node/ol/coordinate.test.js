import {assert} from 'chai';
import {
  add as addCoordinate,
  closestOnCircle,
  closestOnSegment,
  equals as coordinatesEqual,
  createStringXY,
  degreesToStringHDMS,
  format as formatCoordinate,
  rotate as rotateCoordinate,
  scale as scaleCoordinate,
  squaredDistanceToSegment,
  toStringHDMS,
  toStringXY,
  wrapX,
} from '../../../src/ol/coordinate.js';
import Circle from '../../../src/ol/geom/Circle.js';
import {get} from '../../../src/ol/proj.js';
import Projection from '../../../src/ol/proj/Projection.js';

describe('ol/coordinate.js', function () {
  describe('#add', function () {
    let coordinate, delta;

    beforeEach(function () {
      coordinate = [50.73, 7.1];
      delta = [-2, 3];
    });

    it('returns a coordinate', function () {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      assert.isArray(returnedCoordinate);
      assert.lengthOf(returnedCoordinate, 2);
    });

    it('adds the delta', function () {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      assert.deepEqual(returnedCoordinate[0], 48.73);
      assert.deepEqual(returnedCoordinate[1], 10.1);
    });

    it('modifies in place', function () {
      addCoordinate(coordinate, delta);
      assert.deepEqual(coordinate[0], 48.73);
      assert.deepEqual(coordinate[1], 10.1);
    });

    it('does not produce unexpected results with string delta values', function () {
      addCoordinate(
        coordinate,
        delta.map(function (n) {
          return String(n);
        }),
      );
      assert.deepEqual(coordinate[0], 48.73);
      assert.deepEqual(coordinate[1], 10.1);
    });
  });

  describe('#equals', function () {
    const cologne = [50.93333, 6.95];
    const bonn1 = [50.73, 7.1];
    const bonn2 = [50.73, 7.1];

    it('compares correctly', function () {
      const bonnEqualsBonn = coordinatesEqual(bonn1, bonn2);
      const bonnEqualsCologne = coordinatesEqual(bonn1, cologne);
      assert.strictEqual(bonnEqualsBonn, true);
      assert.strictEqual(bonnEqualsCologne, false);
    });
  });

  describe('#format', function () {
    let coordinate;
    beforeEach(function () {
      coordinate = [6.6123, 46.7919];
    });

    it('rounds the values', function () {
      const string = formatCoordinate(coordinate, '{x} {y}', 0);
      assert.deepEqual(string, '7 47');
    });

    it('handles the optional fractionDigits param', function () {
      const string = formatCoordinate(coordinate, '{x} {y}', 3);
      assert.deepEqual(string, '6.612 46.792');
    });
  });

  describe('#createStringXY', function () {
    let coordinate, created, formatted;
    beforeEach(function () {
      coordinate = [6.6123, 46.7919];
      created = null;
      formatted = null;
    });

    it('returns a CoordinateFormatType', function () {
      created = createStringXY();
      assert.isFunction(created);

      formatted = created(coordinate);
      assert.isString(formatted);
      assert.deepEqual(formatted, '7, 47');
    });

    it('respects opt_fractionDigits', function () {
      created = createStringXY(3);
      assert.isFunction(created);

      formatted = created(coordinate);
      assert.isString(formatted);
      assert.deepEqual(formatted, '6.612, 46.792');
    });
  });

  describe('#closestOnCircle', function () {
    const center = [5, 10];
    const circle = new Circle(center, 10);
    it('can find the closest point on circle', function () {
      assert.deepEqual(closestOnCircle([-20, 10], circle), [-5, 10]);
    });
    it('can handle coordinate equal circle center', function () {
      assert.deepEqual(closestOnCircle(center, circle), [15, 10]);
    });
  });

  describe('#closestOnSegment', function () {
    it('can handle points where the foot of the perpendicular is closest', function () {
      const point = [2, 5];
      const segment = [
        [-5, 0],
        [10, 0],
      ];
      assert.deepEqual(closestOnSegment(point, segment), [2, 0]);
    });
    it('can handle points where the foot of the perpendicular is not closest', function () {
      const point = [0, -6];
      const segment = [
        [-5, 0],
        [0, -1],
      ];
      assert.deepEqual(closestOnSegment(point, segment), [0, -1]);
    });
  });

  describe('#format', function () {
    it('can deal with undefined coordinate', function () {
      assert.strictEqual(formatCoordinate(), '');
    });
    it('formats a coordinate into a template (default precision is 0)', function () {
      const coord = [7.85, 47.983333];
      const template = 'Coordinate is ({x}|{y}).';
      const got = formatCoordinate(coord, template);
      const expected = 'Coordinate is (8|48).';
      assert.strictEqual(got, expected);
    });
    it('formats a coordinate into a template and respects precision)', function () {
      const coord = [7.85, 47.983333];
      const template = 'Coordinate is ({x}|{y}).';
      const got = formatCoordinate(coord, template, 2);
      const expected = 'Coordinate is (7.85|47.98).';
      assert.strictEqual(got, expected);
    });
  });

  describe('#rotate', function () {
    it('can rotate point in place', function () {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      rotateCoordinate(coord, rotateRadians);
      assert.deepEqual(coord[0].toFixed(6), '-47.983333');
      assert.deepEqual(coord[1].toFixed(6), '7.850000');
    });
    it('returns the rotated point', function () {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      const rotated = rotateCoordinate(coord, rotateRadians);
      assert.deepEqual(rotated[0].toFixed(7), '-47.9833330');
      assert.deepEqual(rotated[1].toFixed(7), '7.8500000');
    });
  });

  describe('#scale', function () {
    it('can scale point in place', function () {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      scaleCoordinate(coord, scale);
      assert.deepEqual(coord[0].toFixed(7), '9.4200000');
      assert.deepEqual(coord[1].toFixed(7), '57.5799996');
    });
    it('returns the scaled point', function () {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      const scaledCoord = scaleCoordinate(coord, scale);
      assert.deepEqual(scaledCoord[0].toFixed(7), '9.4200000');
      assert.deepEqual(scaledCoord[1].toFixed(7), '57.5799996');
    });
  });

  describe('#squaredDistanceToSegment', function () {
    it('can handle points where the foot of the perpendicular is closest', function () {
      const point = [2, 5];
      const segment = [
        [-5, 0],
        [10, 0],
      ];
      assert.deepEqual(squaredDistanceToSegment(point, segment), 25);
    });
    it('can handle points where the foot of the perpendicular is not closest', function () {
      const point = [0, -6];
      const segment = [
        [-5, 0],
        [0, -1],
      ];
      assert.deepEqual(squaredDistanceToSegment(point, segment), 25);
    });
  });

  describe('degreesToStringHDMS', () => {
    it('includes minutes and seconds if non-zero', () => {
      assert.strictEqual(
        degreesToStringHDMS('NS', 10 + 30 / 60 + 30 / 3600),
        '10° 30′ 30″ N',
      );
    });

    it('omits minutes if zero', () => {
      assert.strictEqual(degreesToStringHDMS('NS', 10), '10° N');
    });

    it('includes minutes if seconds are non-zero', () => {
      assert.strictEqual(
        degreesToStringHDMS('NS', 10 + 30 / 3600),
        '10° 00′ 30″ N',
      );
    });

    it('omits seconds if zero', () => {
      assert.strictEqual(degreesToStringHDMS('NS', 10.5), '10° 30′ N');
    });
  });

  describe('#toStringHDMS', function () {
    it('returns the empty string on undefined input', function () {
      const got = toStringHDMS();
      const expected = '';
      assert.strictEqual(got, expected);
    });
    it('formats with zero fractional digits as default', function () {
      const coord = [7.85, 47.983333];
      const got = toStringHDMS(coord);
      const expected = '47° 59′ N 7° 51′ E';
      assert.strictEqual(got, expected);
    });
    it('formats with given fractional digits, if passed', function () {
      const coord = [
        10 + 20 / 60 + 0.3456 / 3600,
        20 + 30 / 60 + 0.4321 / 3600,
      ];
      const got = toStringHDMS(coord, 3);
      const expected = '20° 30′ 00.432″ N 10° 20′ 00.346″ E';
      assert.strictEqual(got, expected);
    });
  });

  describe('#toStringXY', function () {
    it('formats with zero fractional digits as default', function () {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord);
      const expected = '8, 48';
      assert.strictEqual(got, expected);
    });
    it('formats with given fractional digits, if passed', function () {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord, 2);
      const expected = '7.85, 47.98';
      assert.strictEqual(got, expected);
    });
  });

  describe('wrapX()', function () {
    const projection = get('EPSG:4326');

    it('leaves real world coordinate untouched', function () {
      assert.deepEqual(wrapX([16, 48], projection), [16, 48]);
    });

    it('moves left world coordinate to real world', function () {
      assert.deepEqual(wrapX([-344, 48], projection), [16, 48]);
    });

    it('moves right world coordinate to real world', function () {
      assert.deepEqual(wrapX([376, 48], projection), [16, 48]);
    });

    it('moves far off left coordinate to real world', function () {
      assert.deepEqual(wrapX([-1064, 48], projection), [16, 48]);
    });

    it('moves far off right coordinate to real world', function () {
      assert.deepEqual(wrapX([1096, 48], projection), [16, 48]);
    });

    const swiss = new Projection({code: 'EPSG:21781', units: 'm'});

    it('leaves non-global projection coordinates untouched', function () {
      assert.deepEqual(wrapX([1096, 48], swiss), [1096, 48]);
    });
  });
});
