import Circle from '../../../src/ol/geom/Circle.js';
import Projection from '../../../src/ol/proj/Projection.js';
import expect from '../expect.js';
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
import {get} from '../../../src/ol/proj.js';

describe('ol/coordinate.js', function () {
  describe('#add', function () {
    let coordinate, delta;

    beforeEach(function () {
      coordinate = [50.73, 7.1];
      delta = [-2, 3];
    });

    it('returns a coordinate', function () {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      expect(returnedCoordinate).to.be.an('array');
      expect(returnedCoordinate).to.have.length(2);
    });

    it('adds the delta', function () {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      expect(returnedCoordinate[0]).to.eql(48.73);
      expect(returnedCoordinate[1]).to.eql(10.1);
    });

    it('modifies in place', function () {
      addCoordinate(coordinate, delta);
      expect(coordinate[0]).to.eql(48.73);
      expect(coordinate[1]).to.eql(10.1);
    });

    it('does not produce unexpected results with string delta values', function () {
      addCoordinate(
        coordinate,
        delta.map(function (n) {
          return String(n);
        })
      );
      expect(coordinate[0]).to.eql(48.73);
      expect(coordinate[1]).to.eql(10.1);
    });
  });

  describe('#equals', function () {
    const cologne = [50.93333, 6.95];
    const bonn1 = [50.73, 7.1];
    const bonn2 = [50.73, 7.1];

    it('compares correctly', function () {
      const bonnEqualsBonn = coordinatesEqual(bonn1, bonn2);
      const bonnEqualsCologne = coordinatesEqual(bonn1, cologne);
      expect(bonnEqualsBonn).to.be(true);
      expect(bonnEqualsCologne).to.be(false);
    });
  });

  describe('#format', function () {
    let coordinate;
    beforeEach(function () {
      coordinate = [6.6123, 46.7919];
    });

    it('rounds the values', function () {
      const string = formatCoordinate(coordinate, '{x} {y}', 0);
      expect(string).to.eql('7 47');
    });

    it('handles the optional fractionDigits param', function () {
      const string = formatCoordinate(coordinate, '{x} {y}', 3);
      expect(string).to.eql('6.612 46.792');
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
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('7, 47');
    });

    it('respects opt_fractionDigits', function () {
      created = createStringXY(3);
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('6.612, 46.792');
    });
  });

  describe('#closestOnCircle', function () {
    const center = [5, 10];
    const circle = new Circle(center, 10);
    it('can find the closest point on circle', function () {
      expect(closestOnCircle([-20, 10], circle)).to.eql([-5, 10]);
    });
    it('can handle coordinate equal circle center', function () {
      expect(closestOnCircle(center, circle)).to.eql([15, 10]);
    });
  });

  describe('#closestOnSegment', function () {
    it('can handle points where the foot of the perpendicular is closest', function () {
      const point = [2, 5];
      const segment = [
        [-5, 0],
        [10, 0],
      ];
      expect(closestOnSegment(point, segment)).to.eql([2, 0]);
    });
    it('can handle points where the foot of the perpendicular is not closest', function () {
      const point = [0, -6];
      const segment = [
        [-5, 0],
        [0, -1],
      ];
      expect(closestOnSegment(point, segment)).to.eql([0, -1]);
    });
  });

  describe('#format', function () {
    it('can deal with undefined coordinate', function () {
      expect(formatCoordinate()).to.be('');
    });
    it('formats a coordinate into a template (default precision is 0)', function () {
      const coord = [7.85, 47.983333];
      const template = 'Coordinate is ({x}|{y}).';
      const got = formatCoordinate(coord, template);
      const expected = 'Coordinate is (8|48).';
      expect(got).to.be(expected);
    });
    it('formats a coordinate into a template and respects precision)', function () {
      const coord = [7.85, 47.983333];
      const template = 'Coordinate is ({x}|{y}).';
      const got = formatCoordinate(coord, template, 2);
      const expected = 'Coordinate is (7.85|47.98).';
      expect(got).to.be(expected);
    });
  });

  describe('#rotate', function () {
    it('can rotate point in place', function () {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      rotateCoordinate(coord, rotateRadians);
      expect(coord[0].toFixed(6)).to.eql('-47.983333');
      expect(coord[1].toFixed(6)).to.eql('7.850000');
    });
    it('returns the rotated point', function () {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      const rotated = rotateCoordinate(coord, rotateRadians);
      expect(rotated[0].toFixed(7)).to.eql('-47.9833330');
      expect(rotated[1].toFixed(7)).to.eql('7.8500000');
    });
  });

  describe('#scale', function () {
    it('can scale point in place', function () {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      scaleCoordinate(coord, scale);
      expect(coord[0].toFixed(7)).to.eql('9.4200000');
      expect(coord[1].toFixed(7)).to.eql('57.5799996');
    });
    it('returns the scaled point', function () {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      const scaledCoord = scaleCoordinate(coord, scale);
      expect(scaledCoord[0].toFixed(7)).to.eql('9.4200000');
      expect(scaledCoord[1].toFixed(7)).to.eql('57.5799996');
    });
  });

  describe('#squaredDistanceToSegment', function () {
    it('can handle points where the foot of the perpendicular is closest', function () {
      const point = [2, 5];
      const segment = [
        [-5, 0],
        [10, 0],
      ];
      expect(squaredDistanceToSegment(point, segment)).to.eql(25);
    });
    it('can handle points where the foot of the perpendicular is not closest', function () {
      const point = [0, -6];
      const segment = [
        [-5, 0],
        [0, -1],
      ];
      expect(squaredDistanceToSegment(point, segment)).to.eql(25);
    });
  });

  describe('degreesToStringHDMS', () => {
    it('includes minutes and seconds if non-zero', () => {
      expect(degreesToStringHDMS('NS', 10 + 30 / 60 + 30 / 3600)).to.be(
        '10° 30′ 30″ N'
      );
    });

    it('omits minutes if zero', () => {
      expect(degreesToStringHDMS('NS', 10)).to.be('10° N');
    });

    it('includes minutes if seconds are non-zero', () => {
      expect(degreesToStringHDMS('NS', 10 + 30 / 3600)).to.be('10° 00′ 30″ N');
    });

    it('omits seconds if zero', () => {
      expect(degreesToStringHDMS('NS', 10.5)).to.be('10° 30′ N');
    });
  });

  describe('#toStringHDMS', function () {
    it('returns the empty string on undefined input', function () {
      const got = toStringHDMS();
      const expected = '';
      expect(got).to.be(expected);
    });
    it('formats with zero fractional digits as default', function () {
      const coord = [7.85, 47.983333];
      const got = toStringHDMS(coord);
      const expected = '47° 59′ N 7° 51′ E';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function () {
      const coord = [
        10 + 20 / 60 + 0.3456 / 3600,
        20 + 30 / 60 + 0.4321 / 3600,
      ];
      const got = toStringHDMS(coord, 3);
      const expected = '20° 30′ 00.432″ N 10° 20′ 00.346″ E';
      expect(got).to.be(expected);
    });
  });

  describe('#toStringXY', function () {
    it('formats with zero fractional digits as default', function () {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord);
      const expected = '8, 48';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function () {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord, 2);
      const expected = '7.85, 47.98';
      expect(got).to.be(expected);
    });
  });

  describe('wrapX()', function () {
    const projection = get('EPSG:4326');

    it('leaves real world coordinate untouched', function () {
      expect(wrapX([16, 48], projection)).to.eql([16, 48]);
    });

    it('moves left world coordinate to real world', function () {
      expect(wrapX([-344, 48], projection)).to.eql([16, 48]);
    });

    it('moves right world coordinate to real world', function () {
      expect(wrapX([376, 48], projection)).to.eql([16, 48]);
    });

    it('moves far off left coordinate to real world', function () {
      expect(wrapX([-1064, 48], projection)).to.eql([16, 48]);
    });

    it('moves far off right coordinate to real world', function () {
      expect(wrapX([1096, 48], projection)).to.eql([16, 48]);
    });

    const swiss = new Projection({code: 'EPSG:21781', units: 'm'});

    it('leaves non-global projection coordinates untouched', function () {
      expect(wrapX([1096, 48], swiss)).to.eql([1096, 48]);
    });
  });
});
