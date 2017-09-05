

import _ol_coordinate_ from '../../../src/ol/coordinate';
import _ol_geom_Circle_ from '../../../src/ol/geom/circle';


describe('ol.coordinate', function() {

  describe('#add', function() {
    var coordinate, delta;

    beforeEach(function() {
      coordinate = [50.73, 7.1];
      delta = [-2, 3];
    });

    it('returns a coordinate', function() {
      var returnedCoordinate = _ol_coordinate_.add(coordinate, delta);
      expect(returnedCoordinate).to.be.an('array');
      expect(returnedCoordinate).to.have.length(2);
    });

    it('adds the delta', function() {
      var returnedCoordinate = _ol_coordinate_.add(coordinate, delta);
      expect(returnedCoordinate[0]).to.eql(48.73);
      expect(returnedCoordinate[1]).to.eql(10.1);
    });

    it('modifies in place', function() {
      _ol_coordinate_.add(coordinate, delta);
      expect(coordinate[0]).to.eql(48.73);
      expect(coordinate[1]).to.eql(10.1);
    });
  });

  describe('#equals', function() {
    var cologne = [50.93333, 6.95];
    var bonn1 = [50.73, 7.1];
    var bonn2 = [50.73000, 7.10000];

    it('compares correctly', function() {
      var bonnEqualsBonn = _ol_coordinate_.equals(bonn1, bonn2);
      var bonnEqualsCologne = _ol_coordinate_.equals(bonn1, cologne);
      expect(bonnEqualsBonn).to.be(true);
      expect(bonnEqualsCologne).to.be(false);
    });
  });

  describe('#format', function() {
    var coordinate;
    beforeEach(function() {
      coordinate = [6.6123, 46.7919];
    });

    it('rounds the values', function() {
      var string = _ol_coordinate_.format(coordinate, '{x} {y}', 0);
      expect(string).to.eql('7 47');
    });

    it('handles the optional fractionDigits param', function() {
      var string = _ol_coordinate_.format(coordinate, '{x} {y}', 3);
      expect(string).to.eql('6.612 46.792');
    });
  });

  describe('#createStringXY', function() {
    var coordinate, created, formatted;
    beforeEach(function() {
      coordinate = [6.6123, 46.7919];
      created = null;
      formatted = null;
    });

    it('returns a CoordinateFormatType', function() {
      created = _ol_coordinate_.createStringXY();
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('7, 47');
    });

    it('respects opt_fractionDigits', function() {
      created = _ol_coordinate_.createStringXY(3);
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('6.612, 46.792');
    });
  });

  describe('#closestOnCircle', function() {
    var center = [5, 10];
    var circle = new _ol_geom_Circle_(center, 10);
    it('can find the closest point on circle', function() {
      expect(_ol_coordinate_.closestOnCircle([-20, 10], circle))
          .to.eql([-5, 10]);
    });
    it('can handle coordinate equal circle center', function() {
      expect(_ol_coordinate_.closestOnCircle(center, circle))
          .to.eql([15, 10]);
    });
  });

  describe('#closestOnSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
        function() {
          var point = [2, 5];
          var segment = [[-5, 0], [10, 0]];
          expect(_ol_coordinate_.closestOnSegment(point, segment))
              .to.eql([2, 0]);
        });
    it('can handle points where the foot of the perpendicular is not closest',
        function() {
          var point = [0, -6];
          var segment = [[-5, 0], [0, -1]];
          expect(_ol_coordinate_.closestOnSegment(point, segment))
              .to.eql([0, -1]);
        });
  });

  describe('#format', function() {
    it('can deal with undefined coordinate', function() {
      expect(_ol_coordinate_.format()).to.be('');
    });
    it('formats a coordinate into a template (default precision is 0)',
        function() {
          var coord = [7.85, 47.983333];
          var template = 'Coordinate is ({x}|{y}).';
          var got = _ol_coordinate_.format(coord, template);
          var expected = 'Coordinate is (8|48).';
          expect(got).to.be(expected);
        });
    it('formats a coordinate into a template and respects precision)',
        function() {
          var coord = [7.85, 47.983333];
          var template = 'Coordinate is ({x}|{y}).';
          var got = _ol_coordinate_.format(coord, template, 2);
          var expected = 'Coordinate is (7.85|47.98).';
          expect(got).to.be(expected);
        });
  });

  describe('#rotate', function() {
    it('can rotate point in place', function() {
      var coord = [7.85, 47.983333];
      var rotateRadians = Math.PI / 2; // 90 degrees
      _ol_coordinate_.rotate(coord, rotateRadians);
      expect(coord[0].toFixed(6)).to.eql('-47.983333');
      expect(coord[1].toFixed(6)).to.eql('7.850000');
    });
    it('returns the rotated point', function() {
      var coord = [7.85, 47.983333];
      var rotateRadians = Math.PI / 2; // 90 degrees
      var rotated = _ol_coordinate_.rotate(coord, rotateRadians);
      expect(rotated[0].toFixed(7)).to.eql('-47.9833330');
      expect(rotated[1].toFixed(7)).to.eql('7.8500000');
    });
  });

  describe('#scale', function() {
    it('can scale point in place', function() {
      var coord = [7.85, 47.983333];
      var scale = 1.2;
      _ol_coordinate_.scale(coord, scale);
      expect(coord[0].toFixed(7)).to.eql('9.4200000');
      expect(coord[1].toFixed(7)).to.eql('57.5799996');
    });
    it('returns the scaled point', function() {
      var coord = [7.85, 47.983333];
      var scale = 1.2;
      var scaledCoord = _ol_coordinate_.scale(coord, scale);
      expect(scaledCoord[0].toFixed(7)).to.eql('9.4200000');
      expect(scaledCoord[1].toFixed(7)).to.eql('57.5799996');
    });
  });

  describe('#sub', function() {
    it('can subtract from point in place', function() {
      var coord = [47, 11];
      var delta = [1, -1];
      _ol_coordinate_.sub(coord, delta);
      expect(coord[0]).to.eql(46);
      expect(coord[1]).to.eql(12);
    });
    it('can subtract from point in place', function() {
      var coord = [47, 11];
      var delta = [1, -1];
      var subtracted = _ol_coordinate_.sub(coord, delta);
      expect(subtracted[0]).to.eql(46);
      expect(subtracted[1]).to.eql(12);
    });
  });

  describe('#squaredDistanceToSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
        function() {
          var point = [2, 5];
          var segment = [[-5, 0], [10, 0]];
          expect(_ol_coordinate_.squaredDistanceToSegment(point, segment))
              .to.eql(25);
        });
    it('can handle points where the foot of the perpendicular is not closest',
        function() {
          var point = [0, -6];
          var segment = [[-5, 0], [0, -1]];
          expect(_ol_coordinate_.squaredDistanceToSegment(point, segment))
              .to.eql(25);
        });

  });

  describe('#toStringHDMS', function() {
    it('returns the empty string on undefined input', function() {
      var got = _ol_coordinate_.toStringHDMS();
      var expected = '';
      expect(got).to.be(expected);
    });
    it('formats with zero fractional digits as default', function() {
      var coord = [7.85, 47.983333];
      var got = _ol_coordinate_.toStringHDMS(coord);
      var expected = '47° 59′ 00″ N 7° 51′ 00″ E';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function() {
      var coord = [7.85, 47.983333];
      var got = _ol_coordinate_.toStringHDMS(coord, 3);
      var expected = '47° 58′ 59.999″ N 7° 51′ 00.000″ E';
      expect(got).to.be(expected);
    });
  });

  describe('#toStringXY', function() {
    it('formats with zero fractional digits as default', function() {
      var coord = [7.85, 47.983333];
      var got = _ol_coordinate_.toStringXY(coord);
      var expected = '8, 48';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function() {
      var coord = [7.85, 47.983333];
      var got = _ol_coordinate_.toStringXY(coord, 2);
      var expected = '7.85, 47.98';
      expect(got).to.be(expected);
    });
  });

});
