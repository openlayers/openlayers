import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import {isEmpty} from '../../../../src/ol/extent.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../src/ol/geom/Point.js';

describe('ol/geom/MultiPoint.js', function () {
  it('cannot be constructed with a null geometry', function () {
    assert.throws(function () {
      return new MultiPoint(null);
    });
  });

  describe('construct empty', function () {
    let multiPoint;
    beforeEach(function () {
      multiPoint = new MultiPoint([]);
    });

    it('defaults to layout XY', function () {
      assert.strictEqual(multiPoint.getLayout(), 'XY');
    });

    it('has empty coordinates', function () {
      assert.isEmpty(multiPoint.getCoordinates());
    });

    it('has an empty extent', function () {
      assert.strictEqual(isEmpty(multiPoint.getExtent()), true);
    });

    it('has empty flat coordinates', function () {
      assert.isEmpty(multiPoint.getFlatCoordinates());
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiPoint.getStride(), 2);
    });

    it('can append points', function () {
      multiPoint.appendPoint(new Point([1, 2]));
      assert.deepEqual(multiPoint.getCoordinates(), [[1, 2]]);
      multiPoint.appendPoint(new Point([3, 4]));
      assert.deepEqual(multiPoint.getCoordinates(), [
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('construct with 2D coordinates', function () {
    let multiPoint;
    beforeEach(function () {
      multiPoint = new MultiPoint([
        [1, 2],
        [3, 4],
      ]);
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiPoint.getLayout(), 'XY');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiPoint.getCoordinates(), [
        [1, 2],
        [3, 4],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiPoint.getExtent(), [1, 2, 3, 4]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(multiPoint.getFlatCoordinates(), [1, 2, 3, 4]);
    });

    it('has stride the expected stride', function () {
      assert.strictEqual(multiPoint.getStride(), 2);
    });

    describe('#intersectsExtent()', function () {
      it('returns true for extent covering a point', function () {
        assert.strictEqual(multiPoint.intersectsExtent([1, 2, 2, 2]), true);
      });

      it('returns false for non-matching extent within own extent', function () {
        assert.strictEqual(multiPoint.intersectsExtent([2, 3, 2, 4]), false);
      });
    });
  });

  describe('construct with 3D coordinates', function () {
    let multiPoint;
    beforeEach(function () {
      multiPoint = new MultiPoint([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiPoint.getLayout(), 'XYZ');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiPoint.getCoordinates(), [
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiPoint.getExtent(), [1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(multiPoint.getFlatCoordinates(), [1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      assert.strictEqual(multiPoint.getStride(), 3);
    });
  });

  describe('construct with 3D coordinates and layout XYM', function () {
    let multiPoint;
    beforeEach(function () {
      multiPoint = new MultiPoint(
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        'XYM',
      );
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiPoint.getLayout(), 'XYM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiPoint.getCoordinates(), [
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiPoint.getExtent(), [1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(multiPoint.getFlatCoordinates(), [1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      assert.strictEqual(multiPoint.getStride(), 3);
    });

    it('can return individual points', function () {
      const point0 = multiPoint.getPoint(0);
      assert.strictEqual(point0.getLayout(), 'XYM');
      assert.deepEqual(point0.getCoordinates(), [1, 2, 3]);
      const point1 = multiPoint.getPoint(1);
      assert.strictEqual(point1.getLayout(), 'XYM');
      assert.deepEqual(point1.getCoordinates(), [4, 5, 6]);
    });

    it('can return all points', function () {
      const points = multiPoint.getPoints();
      assert.lengthOf(points, 2);
      assert.instanceOf(points[0], Point);
      assert.strictEqual(points[0].getLayout(), 'XYM');
      assert.deepEqual(points[0].getCoordinates(), [1, 2, 3]);
      assert.instanceOf(points[1], Point);
      assert.strictEqual(points[1].getLayout(), 'XYM');
      assert.deepEqual(points[1].getCoordinates(), [4, 5, 6]);
    });
  });

  describe('construct with 4D coordinates', function () {
    let multiPoint;
    beforeEach(function () {
      multiPoint = new MultiPoint([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]);
    });

    it('has the expected layout', function () {
      assert.strictEqual(multiPoint.getLayout(), 'XYZM');
    });

    it('has the expected coordinates', function () {
      assert.deepEqual(multiPoint.getCoordinates(), [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]);
    });

    it('has the expected extent', function () {
      assert.deepEqual(multiPoint.getExtent(), [1, 2, 5, 6]);
    });

    it('has the expected flat coordinates', function () {
      assert.deepEqual(
        multiPoint.getFlatCoordinates(),
        [1, 2, 3, 4, 5, 6, 7, 8],
      );
    });

    it('has the expected stride', function () {
      assert.strictEqual(multiPoint.getStride(), 4);
    });

    describe('#getClosestPoint', function () {
      it('preserves extra dimensions', function () {
        const closestPoint = multiPoint.getClosestPoint([6, 6]);
        assert.deepEqual(closestPoint, [5, 6, 7, 8]);
      });
    });
  });

  describe('#scale()', function () {
    it('scales a multi-point', function () {
      const geom = new MultiPoint([
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
      const geom = new MultiPoint([
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
      const geom = new MultiPoint([
        [-10, -20],
        [10, 20],
      ]);
      geom.scale(3, 2, [-10, -20]);
      const coordinates = geom.getCoordinates();
      assert.deepEqual(coordinates, [
        [-10, -20],
        [50, 60],
      ]);
    });
  });

  describe('#applyTransform()', function () {
    let multi, transform;
    beforeEach(function () {
      multi = new MultiPoint([
        [1, 2],
        [3, 4],
      ]);
      transform = sinonSpy();
    });

    it('calls a transform function', function () {
      multi.applyTransform(transform);
      assert.strictEqual(transform.calledOnce, true);
      const args = transform.firstCall.args;
      assert.lengthOf(args, 4);

      assert.strictEqual(args[0], multi.getFlatCoordinates());
      assert.strictEqual(args[1], multi.getFlatCoordinates());
      assert.strictEqual(args[2], 2);
      assert.strictEqual(args[3], 2);
    });

    it('allows for modification of coordinates', function () {
      const mod = function (input, output, dimension) {
        const copy = input.slice();
        for (let i = 0, ii = copy.length; i < ii; i += dimension) {
          output[i] = copy[i + 1];
          output[i + 1] = copy[i];
        }
      };
      multi.applyTransform(mod);
      assert.deepEqual(multi.getCoordinates(), [
        [2, 1],
        [4, 3],
      ]);
    });

    it('returns undefined', function () {
      const got = multi.applyTransform(transform);
      assert.strictEqual(got, undefined);
    });
  });

  describe('#transform()', function () {
    it('transforms a geometry given CRS identifiers', function () {
      const multi = new MultiPoint([
        [-111, 45],
        [111, -45],
      ]).transform('EPSG:4326', 'EPSG:3857');

      assert.instanceOf(multi, MultiPoint);

      const coords = multi.getCoordinates();

      assert.approximately(coords[0][0], -12356463.47, 1e-2);
      assert.approximately(coords[0][1], 5621521.48, 1e-2);

      assert.approximately(coords[1][0], 12356463.47, 1e-2);
      assert.approximately(coords[1][1], -5621521.48, 1e-2);
    });
  });

  describe('#containsXY()', function () {
    it('does contain XY', function () {
      const multi = new MultiPoint([
        [1, 2],
        [10, 20],
      ]);

      assert.strictEqual(multi.containsXY(1, 2), true);
      assert.strictEqual(multi.containsXY(10, 20), true);
    });

    it('does not contain XY', function () {
      const multi = new MultiPoint([
        [1, 2],
        [10, 20],
      ]);

      assert.strictEqual(multi.containsXY(1, 3), false);
      assert.strictEqual(multi.containsXY(2, 2), false);
      assert.strictEqual(multi.containsXY(2, 3), false);

      assert.strictEqual(multi.containsXY(10, 30), false);
      assert.strictEqual(multi.containsXY(20, 20), false);
      assert.strictEqual(multi.containsXY(20, 30), false);
    });
  });
});
