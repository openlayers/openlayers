import {add as addCoordinate, scale as scaleCoordinate, rotate as rotateCoordinate, equals as coordinatesEqual, format as formatCoordinate, closestOnCircle, closestOnSegment, createStringXY, squaredDistanceToSegment, toStringXY, toStringHDMS} from '../../../src/ol/coordinate.js';
import Circle from '../../../src/ol/geom/Circle.js';


describe('ol.coordinate', function() {

  describe('#add', function() {
    let coordinate, delta;

    beforeEach(function() {
      coordinate = [50.73, 7.1];
      delta = [-2, 3];
    });

    it('returns a coordinate', function() {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      expect(returnedCoordinate).to.be.an('array');
      expect(returnedCoordinate).to.have.length(2);
    });

    it('adds the delta', function() {
      const returnedCoordinate = addCoordinate(coordinate, delta);
      expect(returnedCoordinate[0]).to.eql(48.73);
      expect(returnedCoordinate[1]).to.eql(10.1);
    });

    it('modifies in place', function() {
      addCoordinate(coordinate, delta);
      expect(coordinate[0]).to.eql(48.73);
      expect(coordinate[1]).to.eql(10.1);
    });

    it('does not produce unexpected results with string delta values', function() {
      addCoordinate(coordinate, delta.map(function(n) {
        return String(n);
      }));
      expect(coordinate[0]).to.eql(48.73);
      expect(coordinate[1]).to.eql(10.1);
    });
  });

  describe('#equals', function() {
    const cologne = [50.93333, 6.95];
    const bonn1 = [50.73, 7.1];
    const bonn2 = [50.73000, 7.10000];

    it('compares correctly', function() {
      const bonnEqualsBonn = coordinatesEqual(bonn1, bonn2);
      const bonnEqualsCologne = coordinatesEqual(bonn1, cologne);
      expect(bonnEqualsBonn).to.be(true);
      expect(bonnEqualsCologne).to.be(false);
    });
  });

  describe('#format', function() {
    let coordinate;
    beforeEach(function() {
      coordinate = [6.6123, 46.7919];
    });

    it('rounds the values', function() {
      const string = formatCoordinate(coordinate, '{x} {y}', 0);
      expect(string).to.eql('7 47');
    });

    it('handles the optional fractionDigits param', function() {
      const string = formatCoordinate(coordinate, '{x} {y}', 3);
      expect(string).to.eql('6.612 46.792');
    });
  });

  describe('#createStringXY', function() {
    let coordinate, created, formatted;
    beforeEach(function() {
      coordinate = [6.6123, 46.7919];
      created = null;
      formatted = null;
    });

    it('returns a CoordinateFormatType', function() {
      created = createStringXY();
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('7, 47');
    });

    it('respects opt_fractionDigits', function() {
      created = createStringXY(3);
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('6.612, 46.792');
    });
  });

  describe('#closestOnCircle', function() {
    const center = [5, 10];
    const circle = new Circle(center, 10);
    it('can find the closest point on circle', function() {
      expect(closestOnCircle([-20, 10], circle))
        .to.eql([-5, 10]);
    });
    it('can handle coordinate equal circle center', function() {
      expect(closestOnCircle(center, circle))
        .to.eql([15, 10]);
    });
  });

  describe('#closestOnSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
      function() {
        const point = [2, 5];
        const segment = [[-5, 0], [10, 0]];
        expect(closestOnSegment(point, segment))
          .to.eql([2, 0]);
      });
    it('can handle points where the foot of the perpendicular is not closest',
      function() {
        const point = [0, -6];
        const segment = [[-5, 0], [0, -1]];
        expect(closestOnSegment(point, segment))
          .to.eql([0, -1]);
      });
  });

  describe('#format', function() {
    it('can deal with undefined coordinate', function() {
      expect(formatCoordinate()).to.be('');
    });
    it('formats a coordinate into a template (default precision is 0)',
      function() {
        const coord = [7.85, 47.983333];
        const template = 'Coordinate is ({x}|{y}).';
        const got = formatCoordinate(coord, template);
        const expected = 'Coordinate is (8|48).';
        expect(got).to.be(expected);
      });
    it('formats a coordinate into a template and respects precision)',
      function() {
        const coord = [7.85, 47.983333];
        const template = 'Coordinate is ({x}|{y}).';
        const got = formatCoordinate(coord, template, 2);
        const expected = 'Coordinate is (7.85|47.98).';
        expect(got).to.be(expected);
      });
  });

  describe('#rotate', function() {
    it('can rotate point in place', function() {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      rotateCoordinate(coord, rotateRadians);
      expect(coord[0].toFixed(6)).to.eql('-47.983333');
      expect(coord[1].toFixed(6)).to.eql('7.850000');
    });
    it('returns the rotated point', function() {
      const coord = [7.85, 47.983333];
      const rotateRadians = Math.PI / 2; // 90 degrees
      const rotated = rotateCoordinate(coord, rotateRadians);
      expect(rotated[0].toFixed(7)).to.eql('-47.9833330');
      expect(rotated[1].toFixed(7)).to.eql('7.8500000');
    });
  });

  describe('#scale', function() {
    it('can scale point in place', function() {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      scaleCoordinate(coord, scale);
      expect(coord[0].toFixed(7)).to.eql('9.4200000');
      expect(coord[1].toFixed(7)).to.eql('57.5799996');
    });
    it('returns the scaled point', function() {
      const coord = [7.85, 47.983333];
      const scale = 1.2;
      const scaledCoord = scaleCoordinate(coord, scale);
      expect(scaledCoord[0].toFixed(7)).to.eql('9.4200000');
      expect(scaledCoord[1].toFixed(7)).to.eql('57.5799996');
    });
  });

  describe('#squaredDistanceToSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
      function() {
        const point = [2, 5];
        const segment = [[-5, 0], [10, 0]];
        expect(squaredDistanceToSegment(point, segment))
          .to.eql(25);
      });
    it('can handle points where the foot of the perpendicular is not closest',
      function() {
        const point = [0, -6];
        const segment = [[-5, 0], [0, -1]];
        expect(squaredDistanceToSegment(point, segment))
          .to.eql(25);
      });

  });

  describe('#toStringHDMS', function() {
    it('returns the empty string on undefined input', function() {
      const got = toStringHDMS();
      const expected = '';
      expect(got).to.be(expected);
    });
    it('formats with zero fractional digits as default', function() {
      const coord = [7.85, 47.983333];
      const got = toStringHDMS(coord);
      const expected = '47° 59′ 00″ N 7° 51′ 00″ E';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function() {
      const coord = [7.85, 47.983333];
      const got = toStringHDMS(coord, 3);
      const expected = '47° 58′ 59.999″ N 7° 51′ 00.000″ E';
      expect(got).to.be(expected);
    });
  });

  describe('#toStringXY', function() {
    it('formats with zero fractional digits as default', function() {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord);
      const expected = '8, 48';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function() {
      const coord = [7.85, 47.983333];
      const got = toStringXY(coord, 2);
      const expected = '7.85, 47.98';
      expect(got).to.be(expected);
    });
  });

});
