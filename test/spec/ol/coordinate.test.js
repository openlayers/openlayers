goog.provide('ol.test.coordinate');

goog.require('ol.coordinate');


describe('ol.coordinate', function() {

  describe('#add', function() {
    var coordinate, delta;

    beforeEach(function() {
      coordinate = [50.73, 7.1];
      delta = [-2, 3];
    });

    it('returns a coordinate', function() {
      var returnedCoordinate = ol.coordinate.add(coordinate, delta);
      expect(returnedCoordinate).to.be.an('array');
      expect(returnedCoordinate).to.have.length(2);
    });

    it('adds the delta', function() {
      var returnedCoordinate = ol.coordinate.add(coordinate, delta);
      expect(returnedCoordinate[0]).to.eql(48.73);
      expect(returnedCoordinate[1]).to.eql(10.1);
    });

    it('modifies in place', function() {
      ol.coordinate.add(coordinate, delta);
      expect(coordinate[0]).to.eql(48.73);
      expect(coordinate[1]).to.eql(10.1);
    });
  });

  describe('#equals', function() {
    var cologne = [50.93333, 6.95];
    var bonn1 = [50.73, 7.1];
    var bonn2 = [50.73000, 7.10000];

    it('compares correctly', function() {
      var bonnEqualsBonn = ol.coordinate.equals(bonn1, bonn2);
      var bonnEqualsCologne = ol.coordinate.equals(bonn1, cologne);
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
      var string = ol.coordinate.format(coordinate, '{x} {y}', 0);
      expect(string).to.eql('7 47');
    });

    it('handles the optional fractionDigits param', function() {
      var string = ol.coordinate.format(coordinate, '{x} {y}', 3);
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
      created = ol.coordinate.createStringXY();
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('7, 47');
    });

    it('respects opt_fractionDigits', function() {
      created = ol.coordinate.createStringXY(3);
      expect(created).to.be.a('function');

      formatted = created(coordinate);
      expect(formatted).to.be.a('string');
      expect(formatted).to.eql('6.612, 46.792');
    });
  });

  describe('#closestOnSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
        function() {
          var point = [2, 5];
          var segment = [[-5, 0], [10, 0]];
          expect(ol.coordinate.closestOnSegment(point, segment))
              .to.eql([2, 0]);
        });
    it('can handle points where the foot of the perpendicular is not closest',
        function() {
          var point = [0, -6];
          var segment = [[-5, 0], [0, -1]];
          expect(ol.coordinate.closestOnSegment(point, segment))
              .to.eql([0, -1]);
        });
  });

  describe('#format', function() {
    it('can deal with undefined coordinate', function() {
      expect(ol.coordinate.format()).to.be('');
    });
    it('formats a coordinate into a template (default precision is 0)',
        function() {
          var coord = [7.85, 47.983333];
          var template = 'Coordinate is ({x}|{y}).';
          var got = ol.coordinate.format(coord, template);
          var expected = 'Coordinate is (8|48).';
          expect(got).to.be(expected);
        });
    it('formats a coordinate into a template and respects precision)',
        function() {
          var coord = [7.85, 47.983333];
          var template = 'Coordinate is ({x}|{y}).';
          var got = ol.coordinate.format(coord, template, 2);
          var expected = 'Coordinate is (7.85|47.98).';
          expect(got).to.be(expected);
        });
  });

  describe('#rotate', function() {
    it('can rotate point in place', function() {
      var coord = [7.85, 47.983333];
      var rotateRadians = Math.PI / 2; // 90 degrees
      ol.coordinate.rotate(coord, rotateRadians);
      expect(coord[0].toFixed(6)).to.eql('-47.983333');
      expect(coord[1].toFixed(6)).to.eql('7.850000');
    });
    it('returns the rotated point', function() {
      var coord = [7.85, 47.983333];
      var rotateRadians = Math.PI / 2; // 90 degrees
      var rotated = ol.coordinate.rotate(coord, rotateRadians);
      expect(rotated[0].toFixed(7)).to.eql('-47.9833330');
      expect(rotated[1].toFixed(7)).to.eql('7.8500000');
    });
  });

  describe('#scale', function() {
    it('can scale point in place', function() {
      var coord = [7.85, 47.983333];
      var scale = 1.2;
      ol.coordinate.scale(coord, scale);
      expect(coord[0].toFixed(7)).to.eql('9.4200000');
      expect(coord[1].toFixed(7)).to.eql('57.5799996');
    });
    it('returns the scaled point', function() {
      var coord = [7.85, 47.983333];
      var scale = 1.2;
      var scaledCoord = ol.coordinate.scale(coord, scale);
      expect(scaledCoord[0].toFixed(7)).to.eql('9.4200000');
      expect(scaledCoord[1].toFixed(7)).to.eql('57.5799996');
    });
  });

  describe('#sub', function() {
    it('can subtract from point in place', function() {
      var coord = [47, 11];
      var delta = [1, -1];
      ol.coordinate.sub(coord, delta);
      expect(coord[0]).to.eql(46);
      expect(coord[1]).to.eql(12);
    });
    it('can subtract from point in place', function() {
      var coord = [47, 11];
      var delta = [1, -1];
      var subtracted = ol.coordinate.sub(coord, delta);
      expect(subtracted[0]).to.eql(46);
      expect(subtracted[1]).to.eql(12);
    });
  });

  describe('#squaredDistanceToSegment', function() {
    it('can handle points where the foot of the perpendicular is closest',
        function() {
          var point = [2, 5];
          var segment = [[-5, 0], [10, 0]];
          expect(ol.coordinate.squaredDistanceToSegment(point, segment))
              .to.eql(25);
        });
    it('can handle points where the foot of the perpendicular is not closest',
        function() {
          var point = [0, -6];
          var segment = [[-5, 0], [0, -1]];
          expect(ol.coordinate.squaredDistanceToSegment(point, segment))
              .to.eql(25);
        });

  });

  describe('#toStringHDMS', function() {
    it('returns the empty string on undefined input', function() {
      var got = ol.coordinate.toStringHDMS();
      var expected = '';
      expect(got).to.be(expected);
    });
    it('formats with zero fractional digits as default', function() {
      var coord = [7.85, 47.983333];
      var got = ol.coordinate.toStringHDMS(coord);
      var expected = '47° 58′ 60″ N 7° 50′ 60″ E';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function() {
      var coord = [7.85, 47.983333];
      var got = ol.coordinate.toStringHDMS(coord, 3);
      var expected = '47° 58′ 59.999″ N 7° 50′ 60.000″ E';
      expect(got).to.be(expected);
    });
  });

  describe('#toStringXY', function() {
    it('formats with zero fractional digits as default', function() {
      var coord = [7.85, 47.983333];
      var got = ol.coordinate.toStringXY(coord);
      var expected = '8, 48';
      expect(got).to.be(expected);
    });
    it('formats with given fractional digits, if passed', function() {
      var coord = [7.85, 47.983333];
      var got = ol.coordinate.toStringXY(coord, 2);
      var expected = '7.85, 47.98';
      expect(got).to.be(expected);
    });
  });

  describe('#fromProjectedArray', function() {
    it('returns an inverted coord for "n" or "s"', function() {
      var northCoord = ol.coordinate.fromProjectedArray([1, 2], 'n');
      var southCoord = ol.coordinate.fromProjectedArray([1, 2], 's');
      expect(northCoord).to.eql([2, 1]);
      expect(southCoord).to.eql([2, 1]);
    });
    it('returns an unchanged coord for any other "axis"', function() {
      var eastCoord = ol.coordinate.fromProjectedArray([1, 2], 'e');
      var westCoord = ol.coordinate.fromProjectedArray([1, 2], 'w');
      var bogusCoord = ol.coordinate.fromProjectedArray([1, 2], 'q');
      var unchangedCoord = ol.coordinate.fromProjectedArray([1, 2], '');
      expect(eastCoord).to.eql([1, 2]);
      expect(westCoord).to.eql([1, 2]);
      expect(bogusCoord).to.eql([1, 2]);
      expect(unchangedCoord).to.eql([1, 2]);
    });
  });
});
