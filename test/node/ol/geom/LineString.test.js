import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import {isEmpty} from '../../../../src/ol/extent.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import {assertArrayLikeEqual} from '../../../util/equal.js';

describe('ol/geom/LineString.js', function () {
  it('cannot be constructed with a null geometry', function () {
    assert.throws(function () {
      return new LineString(null);
    });
  });

  describe('construct empty', function () {
    let lineString;
    beforeEach(function () {
      lineString = new LineString([]);
    });

    it('defaults to layout XY', function () {
      assert.strictEqual(lineString.getLayout(), 'XY');
    });

    it('has empty coordinates', function () {
      assert.isEmpty(lineString.getCoordinates());
    });

    it('has an empty extent', function () {
      assert.strictEqual(isEmpty(lineString.getExtent()), true);
    });

    it('has empty flat coordinates', function () {
      assert.isEmpty(lineString.getFlatCoordinates());
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(lineString.getStride(), 2);
    });

    it('can append coordinates', function () {
      lineString.appendCoordinate([1, 2]);
      assert.deepEqual(lineString.getCoordinates(), [[1, 2]]);
      lineString.appendCoordinate([3, 4]);
      assert.deepEqual(lineString.getCoordinates(), [
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
      assert.strictEqual(lineString.getLayout(), 'XY');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(lineString.getCoordinates(), [
        [1, 2],
        [3, 4],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(lineString.getExtent(), [1, 2, 3, 4]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(lineString.getFlatCoordinates(), [1, 2, 3, 4]);
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(lineString.getStride(), 2);
    });

    describe('#intersectsCoordinate', function () {
      it('returns true for an intersecting coordinate', function () {
        assert.strictEqual(lineString.intersectsCoordinate([1.5, 2.5]), true);
      });
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        assert.strictEqual(lineString.intersectsExtent([1, 3, 1.9, 4]), false);
      });

      it('return true for extent on midpoint', function () {
        assert.strictEqual(lineString.intersectsExtent([2, 3, 4, 3]), true);
      });

      it("returns true for the geom's own extent", function () {
        assert.strictEqual(
          lineString.intersectsExtent(lineString.getExtent()),
          true,
        );
      });
    });

    describe('#intersectsCoordinate', function () {
      it('detects intersecting coordinates', function () {
        assert.strictEqual(lineString.intersectsCoordinate([1, 2]), true);
      });
    });

    describe('#getClosestPoint', function () {
      it('uses existing vertices', function () {
        const closestPoint = lineString.getClosestPoint([0.9, 1.8]);
        assert.deepEqual(closestPoint, [1, 2]);
      });
    });

    describe('#getCoordinateAt', function () {
      it('return the first point when fraction is 0', function () {
        assert.deepEqual(lineString.getCoordinateAt(0), [1, 2]);
      });

      it('return the last point when fraction is 1', function () {
        assert.deepEqual(lineString.getCoordinateAt(1), [3, 4]);
      });

      it('return the mid point when fraction is 0.5', function () {
        assert.deepEqual(lineString.getCoordinateAt(0.5), [2, 3]);
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
      assert.strictEqual(lineString.getLayout(), 'XYZ');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(lineString.getCoordinates(), [
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(lineString.getExtent(), [1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(lineString.getFlatCoordinates(), [1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      assert.strictEqual(lineString.getStride(), 3);
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        assert.strictEqual(lineString.intersectsExtent([1, 3, 1.9, 4]), false);
      });

      it('return true for extent on midpoint', function () {
        assert.strictEqual(lineString.intersectsExtent([2, 3, 4, 3]), true);
      });

      it("returns true for the geom's own extent", function () {
        assert.strictEqual(
          lineString.intersectsExtent(lineString.getExtent()),
          true,
        );
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
      assert.strictEqual(lineString.getLayout(), 'XYM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(lineString.getCoordinates(), [
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(lineString.getExtent(), [1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(lineString.getFlatCoordinates(), [1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      assert.strictEqual(lineString.getStride(), 3);
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        assert.strictEqual(lineString.intersectsExtent([1, 3, 1.9, 4]), false);
      });

      it('return true for extent on midpoint', function () {
        assert.strictEqual(lineString.intersectsExtent([2, 3, 4, 3]), true);
      });

      it("returns true for the geom's own extent", function () {
        assert.strictEqual(
          lineString.intersectsExtent(lineString.getExtent()),
          true,
        );
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
      assert.strictEqual(lineString.getLayout(), 'XYZM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(lineString.getCoordinates(), [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(lineString.getExtent(), [1, 2, 5, 6]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(
        lineString.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
    });

    it('has the expected stride', function () {
      assert.strictEqual(lineString.getStride(), 4);
    });

    describe('#intersectsExtent', function () {
      it('return false for non matching extent', function () {
        assert.strictEqual(lineString.intersectsExtent([1, 3, 1.9, 4]), false);
      });

      it('return true for extent on midpoint', function () {
        assert.strictEqual(lineString.intersectsExtent([2, 3, 4, 3]), true);
      });

      it("returns true for the geom's own extent", function () {
        assert.strictEqual(
          lineString.intersectsExtent(lineString.getExtent()),
          true,
        );
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
      assert.deepEqual(coordinates, [
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
      assert.deepEqual(coordinates, [
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
      assert.deepEqual(coordinates, [
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
        assert.deepEqual(lineString.getFirstCoordinate(), [0, 0]);
      });
    });

    describe('#getFlatMidpoint', function () {
      it('returns the expected result', function () {
        const midpoint = lineString.getFlatMidpoint();
        assert.instanceOf(midpoint, Array);
        assert.lengthOf(midpoint, 2);
        assert.approximately(midpoint[0], 4, 1e-1);
        assert.approximately(midpoint[1], 2, 1e-1);
      });
    });

    describe('#getLastCoordinate', function () {
      it('returns the expected result', function () {
        assert.deepEqual(lineString.getLastCoordinate(), [7, 5]);
      });
    });

    describe('#simplify', function () {
      it('returns a simplified geometry', function () {
        const simplified = lineString.simplify(1);
        assert.instanceOf(simplified, LineString);
        assert.deepEqual(simplified.getCoordinates(), [
          [0, 0],
          [3, 3],
          [5, 1],
          [7, 5],
        ]);
      });

      it('does not modify the original', function () {
        lineString.simplify(1);
        assert.deepEqual(lineString.getCoordinates(), [
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
        assert.deepEqual(
          simplified.getCoordinates(),
          internal.getCoordinates(),
        );
      });
    });

    describe('#getSimplifiedGeometry', function () {
      it('returns the expectedResult', function () {
        const simplifiedGeometry = lineString.getSimplifiedGeometry(1);
        assert.instanceOf(simplifiedGeometry, LineString);
        assert.deepEqual(simplifiedGeometry.getCoordinates(), [
          [0, 0],
          [3, 3],
          [5, 1],
          [7, 5],
        ]);
      });

      it('remembers the minimum squared tolerance', function () {
        sinonSpy(lineString, 'getSimplifiedGeometryInternal');
        const simplifiedGeometry1 = lineString.getSimplifiedGeometry(0.05);
        assert.strictEqual(
          lineString.getSimplifiedGeometryInternal.callCount,
          1,
        );
        assert.strictEqual(simplifiedGeometry1, lineString);
        const simplifiedGeometry2 = lineString.getSimplifiedGeometry(0.01);
        assert.strictEqual(
          lineString.getSimplifiedGeometryInternal.callCount,
          1,
        );
        assert.strictEqual(simplifiedGeometry2, lineString);
      });
    });

    describe('#getCoordinateAt', function () {
      it('return the first point when fraction is 0', function () {
        assert.deepEqual(lineString.getCoordinateAt(0), [0, 0]);
      });

      it('return the last point when fraction is 1', function () {
        assert.deepEqual(lineString.getCoordinateAt(1), [7, 5]);
      });

      it('return the mid point when fraction is 0.5', function () {
        const midpoint = lineString.getFlatMidpoint();
        assert.deepEqual(lineString.getCoordinateAt(0.5), midpoint);
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
        assert.deepEqual(lineString.getCoordinateAt(0.5), [2.5, 3.5, 4.5]);
      });
    });

    describe('#getCoordinateAtM', function () {
      it('returns the expected value', function () {
        assert.strictEqual(lineString.getCoordinateAtM(2, false), null);
        assert.deepEqual(lineString.getCoordinateAtM(2, true), [1, 2, 2]);
        assert.deepEqual(lineString.getCoordinateAtM(3, false), [1, 2, 3]);
        assert.deepEqual(lineString.getCoordinateAtM(3, true), [1, 2, 3]);
        assert.deepEqual(lineString.getCoordinateAtM(4, false), [2, 3, 4]);
        assert.deepEqual(lineString.getCoordinateAtM(4, true), [2, 3, 4]);
        assert.deepEqual(lineString.getCoordinateAtM(5, false), [3, 4, 5]);
        assert.deepEqual(lineString.getCoordinateAtM(5, true), [3, 4, 5]);
        assert.deepEqual(lineString.getCoordinateAtM(6, false), [4, 5, 6]);
        assert.deepEqual(lineString.getCoordinateAtM(6, true), [4, 5, 6]);
        assert.deepEqual(lineString.getCoordinateAtM(7, false), null);
        assert.deepEqual(lineString.getCoordinateAtM(7, true), [4, 5, 7]);
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
        assert.deepEqual(lineString.getCoordinateAt(0.5), [11, -11, 22, 11]);
      });
    });

    describe('#getCoordinateAtM', function () {
      it('returns the expected value', function () {
        assert.strictEqual(lineString.getLayout(), 'XYZM');
        let m;
        for (m = 0; m <= 22; m += 0.5) {
          assertArrayLikeEqual(lineString.getCoordinateAtM(m, true), [
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
      assert.strictEqual(lineString.containsXY(1, -1), true);
      assert.strictEqual(lineString.containsXY(16, -16), true);
      assert.strictEqual(lineString.containsXY(3, -3), true);
    });

    it('does not contain XY', function () {
      assert.strictEqual(lineString.containsXY(1, 3), false);
      assert.strictEqual(lineString.containsXY(2, 2), false);
      assert.strictEqual(lineString.containsXY(2, 3), false);
    });
  });
});
