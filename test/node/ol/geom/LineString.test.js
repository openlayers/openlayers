import LineString from '../../../../src/ol/geom/LineString.js';
import expect from '../../expect.js';
import sinon from 'sinon';
import {isEmpty} from '../../../../src/ol/extent.js';

describe('ol/geom/LineString.js', function () {
  it('cannot be constructed with a null geometry', function () {
    expect(function () {
      return new LineString(null);
    }).to.throwException();
  });

  describe('construct empty', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString([]);
    });

    it('defaults to layout XY', function () {
      expect(lineString.getLayout()).to.be('XY');
    });

    it('has empty coordinates', function () {
      expect(lineString.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function () {
      expect(isEmpty(lineString.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function () {
      expect(lineString.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function () {
      expect(lineString.getStride()).to.be(2);
    });

    it('can append coordinates', function () {
      lineString.appendCoordinate([1, 2]);
      expect(lineString.getCoordinates()).to.eql([[1, 2]]);
      lineString.appendCoordinate([3, 4]);
      expect(lineString.getCoordinates()).to.eql([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('construct with 2D coordinates', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString([
        [1, 2],
        [3, 4],
      ]);
    });

    it('has the expected layout', function () {
      expect(lineString.getLayout()).to.be('XY');
    });

    it('has the expected coordinates', function () {
      expect(lineString.getCoordinates()).to.eql([
        [1, 2],
        [3, 4],
      ]);
    });

    it('has the expected extent', function () {
      expect(lineString.getExtent()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected flat coordinates', function () {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has stride the expected stride', function () {
      expect(lineString.getStride()).to.be(2);
    });

    describe('#intersectsCoordinate', function () {
      it('returns true for an intersecting coordinate', function () {
        expect(lineString.intersectsCoordinate([1.5, 2.5])).to.be(true);
      });
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).to.be(false);
      });

      it('return true for extent on midpoint', function () {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).to.be(true);
      });

      it("returns true for the geom's own extent", function () {
        expect(lineString.intersectsExtent(lineString.getExtent())).to.be(true);
      });
    });

    describe('#intersectsCoordinate', function () {
      it('detects intersecting coordinates', function () {
        expect(lineString.intersectsCoordinate([1, 2])).to.be(true);
      });
    });

    describe('#getClosestPoint', function () {
      it('uses existing vertices', function () {
        const closestPoint = lineString.getClosestPoint([0.9, 1.8]);
        expect(closestPoint).to.eql([1, 2]);
      });
    });

    describe('#getCoordinateAt', function () {
      it('return the first point when fraction is 0', function () {
        expect(lineString.getCoordinateAt(0)).to.eql([1, 2]);
      });

      it('return the last point when fraction is 1', function () {
        expect(lineString.getCoordinateAt(1)).to.eql([3, 4]);
      });

      it('return the mid point when fraction is 0.5', function () {
        expect(lineString.getCoordinateAt(0.5)).to.eql([2, 3]);
      });
    });
  });

  describe('construct with 3D coordinates', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected layout', function () {
      expect(lineString.getLayout()).to.be('XYZ');
    });

    it('has the expected coordinates', function () {
      expect(lineString.getCoordinates()).to.eql([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      expect(lineString.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      expect(lineString.getStride()).to.be(3);
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).to.be(false);
      });

      it('return true for extent on midpoint', function () {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).to.be(true);
      });

      it("returns true for the geom's own extent", function () {
        expect(lineString.intersectsExtent(lineString.getExtent())).to.be(true);
      });
    });
  });

  describe('construct with 3D coordinates and layout XYM', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString(
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        'XYM',
      );
    });

    it('has the expected layout', function () {
      expect(lineString.getLayout()).to.be('XYM');
    });

    it('has the expected coordinates', function () {
      expect(lineString.getCoordinates()).to.eql([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      expect(lineString.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      expect(lineString.getStride()).to.be(3);
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).to.be(false);
      });

      it('return true for extent on midpoint', function () {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).to.be(true);
      });

      it("returns true for the geom's own extent", function () {
        expect(lineString.intersectsExtent(lineString.getExtent())).to.be(true);
      });
    });
  });

  describe('construct with 4D coordinates', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]);
    });

    it('has the expected layout', function () {
      expect(lineString.getLayout()).to.be('XYZM');
    });

    it('has the expected coordinates', function () {
      expect(lineString.getCoordinates()).to.eql([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]);
    });

    it('has the expected extent', function () {
      expect(lineString.getExtent()).to.eql([1, 2, 5, 6]);
    });

    it('has the expected flat coordinates', function () {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has the expected stride', function () {
      expect(lineString.getStride()).to.be(4);
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        expect(lineString.intersectsExtent([1, 3, 1.9, 4])).to.be(false);
      });

      it('return true for extent on midpoint', function () {
        expect(lineString.intersectsExtent([2, 3, 4, 3])).to.be(true);
      });

      it("returns true for the geom's own extent", function () {
        expect(lineString.intersectsExtent(lineString.getExtent())).to.be(true);
      });
    });
  });

  describe('#scale()', function () {
    it('scales a linestring', function () {
      const geom = new LineString([
        [-10, -20],
        [10, 20],
      ]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([
        [-100, -200],
        [100, 200],
      ]);
    });

    it('accepts sx and sy', function () {
      const geom = new LineString([
        [-10, -20],
        [10, 20],
      ]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([
        [-20, -60],
        [20, 60],
      ]);
    });

    it('accepts an anchor', function () {
      const geom = new LineString([
        [-10, -20],
        [10, 20],
      ]);
      geom.scale(3, 2, [10, 20]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([
        [-50, -60],
        [10, 20],
      ]);
    });
  });

  describe('with a simple line string', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString([
        [0, 0],
        [1.5, 1],
        [3, 3],
        [5, 1],
        [6, 3.5],
        [7, 5],
      ]);
    });

    describe('#getFirstCoordinate', function () {
      it('returns the expected result', function () {
        expect(lineString.getFirstCoordinate()).to.eql([0, 0]);
      });
    });

    describe('#getFlatMidpoint', function () {
      it('returns the expected result', function () {
        const midpoint = lineString.getFlatMidpoint();
        expect(midpoint).to.be.an(Array);
        expect(midpoint).to.have.length(2);
        expect(midpoint[0]).to.roughlyEqual(4, 1e-1);
        expect(midpoint[1]).to.roughlyEqual(2, 1e-1);
      });
    });

    describe('#getLastCoordinate', function () {
      it('returns the expected result', function () {
        expect(lineString.getLastCoordinate()).to.eql([7, 5]);
      });
    });

    describe('#simplify', function () {
      it('returns a simplified geometry', function () {
        const simplified = lineString.simplify(1);
        expect(simplified).to.be.an(LineString);
        expect(simplified.getCoordinates()).to.eql([
          [0, 0],
          [3, 3],
          [5, 1],
          [7, 5],
        ]);
      });

      it('does not modify the original', function () {
        lineString.simplify(1);
        expect(lineString.getCoordinates()).to.eql([
          [0, 0],
          [1.5, 1],
          [3, 3],
          [5, 1],
          [6, 3.5],
          [7, 5],
        ]);
      });

      it('delegates to the internal method', function () {
        const simplified = lineString.simplify(2);
        const internal = lineString.getSimplifiedGeometry(4);
        expect(simplified.getCoordinates()).to.eql(internal.getCoordinates());
      });
    });

    describe('#getSimplifiedGeometry', function () {
      it('returns the expectedResult', function () {
        const simplifiedGeometry = lineString.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).to.be.an(LineString);
        expect(simplifiedGeometry.getCoordinates()).to.eql([
          [0, 0],
          [3, 3],
          [5, 1],
          [7, 5],
        ]);
      });

      it('remembers the minimum squared tolerance', function () {
        sinon.spy(lineString, 'getSimplifiedGeometryInternal');
        const simplifiedGeometry1 = lineString.getSimplifiedGeometry(0.05);
        expect(lineString.getSimplifiedGeometryInternal.callCount).to.be(1);
        expect(simplifiedGeometry1).to.be(lineString);
        const simplifiedGeometry2 = lineString.getSimplifiedGeometry(0.01);
        expect(lineString.getSimplifiedGeometryInternal.callCount).to.be(1);
        expect(simplifiedGeometry2).to.be(lineString);
      });
    });

    describe('#getCoordinateAt', function () {
      it('return the first point when fraction is 0', function () {
        expect(lineString.getCoordinateAt(0)).to.eql([0, 0]);
      });

      it('return the last point when fraction is 1', function () {
        expect(lineString.getCoordinateAt(1)).to.eql([7, 5]);
      });

      it('return the mid point when fraction is 0.5', function () {
        const midpoint = lineString.getFlatMidpoint();
        expect(lineString.getCoordinateAt(0.5)).to.eql(midpoint);
      });
    });
  });

  describe('with a simple XYM coordinates', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString(
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        'XYM',
      );
    });

    describe('#getCoordinateAt', function () {
      it('returns the expected value', function () {
        expect(lineString.getCoordinateAt(0.5)).to.eql([2.5, 3.5, 4.5]);
      });
    });

    describe('#getCoordinateAtM', function () {
      it('returns the expected value', function () {
        expect(lineString.getCoordinateAtM(2, false)).to.be(null);
        expect(lineString.getCoordinateAtM(2, true)).to.eql([1, 2, 2]);
        expect(lineString.getCoordinateAtM(3, false)).to.eql([1, 2, 3]);
        expect(lineString.getCoordinateAtM(3, true)).to.eql([1, 2, 3]);
        expect(lineString.getCoordinateAtM(4, false)).to.eql([2, 3, 4]);
        expect(lineString.getCoordinateAtM(4, true)).to.eql([2, 3, 4]);
        expect(lineString.getCoordinateAtM(5, false)).to.eql([3, 4, 5]);
        expect(lineString.getCoordinateAtM(5, true)).to.eql([3, 4, 5]);
        expect(lineString.getCoordinateAtM(6, false)).to.eql([4, 5, 6]);
        expect(lineString.getCoordinateAtM(6, true)).to.eql([4, 5, 6]);
        expect(lineString.getCoordinateAtM(7, false)).to.eql(null);
        expect(lineString.getCoordinateAtM(7, true)).to.eql([4, 5, 7]);
      });
    });
  });

  describe('with several XYZM coordinates', function () {
    let lineString;
    beforeEach(function () {
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
        [22, -22, 44, 22],
      ]);
    });

    describe('#getCoordinateAt', function () {
      it('returns the expected value', function () {
        expect(lineString.getCoordinateAt(0.5)).to.eql([11, -11, 22, 11]);
      });
    });

    describe('#getCoordinateAtM', function () {
      it('returns the expected value', function () {
        expect(lineString.getLayout()).to.be('XYZM');
        let m;
        for (m = 0; m <= 22; m += 0.5) {
          expect(lineString.getCoordinateAtM(m, true)).to.eql([
            m,
            -m,
            2 * m,
            m,
          ]);
        }
      });
    });
  });

  describe('#containsXY()', function () {
    let lineString;
    beforeEach(function () {
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
        [22, -22, 44, 22],
      ]);
    });

    it('does contain XY', function () {
      expect(lineString.containsXY(1, -1)).to.be(true);
      expect(lineString.containsXY(16, -16)).to.be(true);
      expect(lineString.containsXY(3, -3)).to.be(true);
    });

    it('does not contain XY', function () {
      expect(lineString.containsXY(1, 3)).to.be(false);
      expect(lineString.containsXY(2, 2)).to.be(false);
      expect(lineString.containsXY(2, 3)).to.be(false);
    });
  });
});
