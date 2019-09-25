import {add as addCoordinate, scale as scaleCoordinate, rotate as rotateCoordinate, equals as coordinatesEqual, format as formatCoordinate, closestOnCircle, closestOnSegment, createStringXY, squaredDistanceToSegment, toStringXY, toStringHDMS} from '../../../src/ol/coordinate.js';
import Circle from '../../../src/ol/geom/Circle.js';


describe('ol.coordinate', () => {

  describe('#add', () => {
    let coordinate, delta;

    beforeEach(() => {
      coordinate = [50.73, 7.1];
      delta = [-2, 3];
    });

    test('returns a coordinate', () => {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      expect(returnedCoordinate).toBeInstanceOf(Array);
      expect(returnedCoordinate).toHaveLength(2);
    });

    test('adds the delta', () => {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      expect(returnedCoordinate[0]).toEqual(48.73);
      expect(returnedCoordinate[1]).toEqual(10.1);
    });

    test('modifies in place', () => {
      addCoordinate(coordinate, delta);
      expect(coordinate[0]).toEqual(48.73);
      expect(coordinate[1]).toEqual(10.1);
    });

    test(
      'does not produce unexpected results with string delta values',
      () => {
        addCoordinate(coordinate, delta.map(function(n) {
          return String(n);
        }));
        expect(coordinate[0]).toEqual(48.73);
        expect(coordinate[1]).toEqual(10.1);
      }
    );
  });

  describe('#equals', () => {
    const cologne = [50.93333, 6.95];
    const bonn1 = [50.73, 7.1];
    const bonn2 = [50.73000, 7.10000];

    test('compares correctly', () => {
      const bonnEqualsBonn = coordinatesEqual(bonn1, bonn2);
      const bonnEqualsCologne = coordinatesEqual(bonn1, cologne);
      expect(bonnEqualsBonn).toBe(true);
      expect(bonnEqualsCologne).toBe(false);
    });
  });

  describe('#format', () => {
    let coordinate;
    beforeEach(() => {
      coordinate = [6.6123, 46.7919];
    });

    test('rounds the values', () => {
      const string = formatCoordinate(coordinate, '{x} {y}', 0);
      expect(string).toEqual('7 47');
    });

    test('handles the optional fractionDigits param', () => {
      const string = formatCoordinate(coordinate, '{x} {y}', 3);
      expect(string).toEqual('6.612 46.792');
    });
  });

  describe('#createStringXY', () => {
    let coordinate, created, formatted;
    beforeEach(() => {
      coordinate = [6.6123, 46.7919];
      created = null;
      formatted = null;
    });

    test('returns a CoordinateFormatType', () => {
      created = createStringXY();
      expect(typeof created).toBe('function');

      formatted = created(coordinate);
      expect(typeof formatted).toBe('string');
      expect(formatted).toEqual('7, 47');
    });

    test('respects opt_fractionDigits', () => {
      created = createStringXY(3);
      expect(typeof created).toBe('function');

      formatted = created(coordinate);
      expect(typeof formatted).toBe('string');
      expect(formatted).toEqual('6.612, 46.792');
    });
  });

  describe('#closestOnCircle', () => {
    const center = [5, 10];
    const circle = new Circle(center, 10);
    test('can find the closest point on circle', () => {
      expect(closestOnCircle([-20, 10], circle)).toEqual([-5, 10]);
    });
    test('can handle coordinate equal circle center', () => {
      expect(closestOnCircle(center, circle)).toEqual([15, 10]);
    });
  });

  describe('#closestOnSegment', () => {
    test(
      'can handle points where the foot of the perpendicular is closest',
      () => {
        const point = [2, 5];
        const segment = [[-5, 0], [10, 0]];
        expect(closestOnSegment(point, segment)).toEqual([2, 0]);
      }
    );
    test(
      'can handle points where the foot of the perpendicular is not closest',
      () => {
        const point = [0, -6];
        const segment = [[-5, 0], [0, -1]];
        expect(closestOnSegment(point, segment)).toEqual([0, -1]);
      }
    );
  });

  describe('#format', () => {
    test('can deal with undefined coordinate', () => {
      expect(formatCoordinate()).toBe('');
    });
    test(
      'formats a coordinate into a template (default precision is 0)',
      () => {
        const coord = [7.85, 47.983333];
        const template = 'Coordinate is ({x}|{y}).';
        const got = formatCoordinate(coord, template);
        const expected = 'Coordinate is (8|48).';
        expect(got).toBe(expected);
      }
    );
    test(
      'formats a coordinate into a template and respects precision)',
      () => {
        const coord = [7.85, 47.983333];
        const template = 'Coordinate is ({x}|{y}).';
        const got = formatCoordinate(coord, template, 2);
        const expected = 'Coordinate is (7.85|47.98).';
        expect(got).toBe(expected);
      }
    );
  });

  describe('#rotate', () => {
    test('can rotate point in place', () => {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      rotateCoordinate(coord, rotateRadians);
      expect(coord[0].toFixed(6)).toEqual('-47.983333');
      expect(coord[1].toFixed(6)).toEqual('7.850000');
    });
    test('returns the rotated point', () => {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      const rotated = rotateCoordinate(coord, rotateRadians);
      expect(rotated[0].toFixed(7)).toEqual('-47.9833330');
      expect(rotated[1].toFixed(7)).toEqual('7.8500000');
    });
  });

  describe('#scale', () => {
    test('can scale point in place', () => {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      scaleCoordinate(coord, scale);
      expect(coord[0].toFixed(7)).toEqual('9.4200000');
      expect(coord[1].toFixed(7)).toEqual('57.5799996');
    });
    test('returns the scaled point', () => {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      const scaledCoord = scaleCoordinate(coord, scale);
      expect(scaledCoord[0].toFixed(7)).toEqual('9.4200000');
      expect(scaledCoord[1].toFixed(7)).toEqual('57.5799996');
    });
  });

  describe('#squaredDistanceToSegment', () => {
    test(
      'can handle points where the foot of the perpendicular is closest',
      () => {
        const point = [2, 5];
        const segment = [[-5, 0], [10, 0]];
        expect(squaredDistanceToSegment(point, segment)).toEqual(25);
      }
    );
    test(
      'can handle points where the foot of the perpendicular is not closest',
      () => {
        const point = [0, -6];
        const segment = [[-5, 0], [0, -1]];
        expect(squaredDistanceToSegment(point, segment)).toEqual(25);
      }
    );

  });

  describe('#toStringHDMS', () => {
    test('returns the empty string on undefined input', () => {
      const got = toStringHDMS();
      const expected = '';
      expect(got).toBe(expected);
    });
    test('formats with zero fractional digits as default', () => {
      const coord = [7.85, 47.983333];
      const got = toStringHDMS(coord);
      const expected = '47° 59′ 00″ N 7° 51′ 00″ E';
      expect(got).toBe(expected);
    });
    test('formats with given fractional digits, if passed', () => {
      const coord = [7.85, 47.983333];
      const got = toStringHDMS(coord, 3);
      const expected = '47° 58′ 59.999″ N 7° 51′ 00.000″ E';
      expect(got).toBe(expected);
    });
  });

  describe('#toStringXY', () => {
    test('formats with zero fractional digits as default', () => {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord);
      const expected = '8, 48';
      expect(got).toBe(expected);
    });
    test('formats with given fractional digits, if passed', () => {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord, 2);
      const expected = '7.85, 47.98';
      expect(got).toBe(expected);
    });
  });

});
