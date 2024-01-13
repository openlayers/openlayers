import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../src/ol/geom/Point.js';
import expect from '../../expect.js';
import sinon from 'sinon';
import {isEmpty} from '../../../../src/ol/extent.js';

describe('ol/geom/MultiPoint.js', function () {
  it('cannot be constructed with a null geometry', function () {
    expect(function () {
      return new MultiPoint(null);
    }).to.throwException();
  });

  describe('construct empty', function () {
    let multiPoint;
    beforeEach(function () {
      multiPoint = new MultiPoint([]);
    });

    it('defaults to layout XY', function () {
      expect(multiPoint.getLayout()).to.be('XY');
    });

    it('has empty coordinates', function () {
      expect(multiPoint.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function () {
      expect(isEmpty(multiPoint.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function () {
      expect(multiPoint.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function () {
      expect(multiPoint.getStride()).to.be(2);
    });

    it('can append points', function () {
      multiPoint.appendPoint(new Point([1, 2]));
      expect(multiPoint.getCoordinates()).to.eql([[1, 2]]);
      multiPoint.appendPoint(new Point([3, 4]));
      expect(multiPoint.getCoordinates()).to.eql([
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
      expect(multiPoint.getLayout()).to.be('XY');
    });

    it('has the expected coordinates', function () {
      expect(multiPoint.getCoordinates()).to.eql([
        [1, 2],
        [3, 4],
      ]);
    });

    it('has the expected extent', function () {
      expect(multiPoint.getExtent()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected flat coordinates', function () {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has stride the expected stride', function () {
      expect(multiPoint.getStride()).to.be(2);
    });

    describe('#intersectsExtent()', function () {
      it('returns true for extent covering a point', function () {
        expect(multiPoint.intersectsExtent([1, 2, 2, 2])).to.be(true);
      });

      it('returns false for non-matching extent within own extent', function () {
        expect(multiPoint.intersectsExtent([2, 3, 2, 4])).to.be(false);
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
      expect(multiPoint.getLayout()).to.be('XYZ');
    });

    it('has the expected coordinates', function () {
      expect(multiPoint.getCoordinates()).to.eql([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      expect(multiPoint.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      expect(multiPoint.getStride()).to.be(3);
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
      expect(multiPoint.getLayout()).to.be('XYM');
    });

    it('has the expected coordinates', function () {
      expect(multiPoint.getCoordinates()).to.eql([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });

    it('has the expected extent', function () {
      expect(multiPoint.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function () {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function () {
      expect(multiPoint.getStride()).to.be(3);
    });

    it('can return individual points', function () {
      const point0 = multiPoint.getPoint(0);
      expect(point0.getLayout()).to.be('XYM');
      expect(point0.getCoordinates()).to.eql([1, 2, 3]);
      const point1 = multiPoint.getPoint(1);
      expect(point1.getLayout()).to.be('XYM');
      expect(point1.getCoordinates()).to.eql([4, 5, 6]);
    });

    it('can return all points', function () {
      const points = multiPoint.getPoints();
      expect(points).to.have.length(2);
      expect(points[0]).to.be.an(Point);
      expect(points[0].getLayout()).to.be('XYM');
      expect(points[0].getCoordinates()).to.eql([1, 2, 3]);
      expect(points[1]).to.be.an(Point);
      expect(points[1].getLayout()).to.be('XYM');
      expect(points[1].getCoordinates()).to.eql([4, 5, 6]);
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
      expect(multiPoint.getLayout()).to.be('XYZM');
    });

    it('has the expected coordinates', function () {
      expect(multiPoint.getCoordinates()).to.eql([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ]);
    });

    it('has the expected extent', function () {
      expect(multiPoint.getExtent()).to.eql([1, 2, 5, 6]);
    });

    it('has the expected flat coordinates', function () {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has the expected stride', function () {
      expect(multiPoint.getStride()).to.be(4);
    });

    describe('#getClosestPoint', function () {
      it('preserves extra dimensions', function () {
        const closestPoint = multiPoint.getClosestPoint([6, 6]);
        expect(closestPoint).to.eql([5, 6, 7, 8]);
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
      expect(coordinates).to.eql([
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
      expect(coordinates).to.eql([
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
      expect(coordinates).to.eql([
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
      transform = sinon.spy();
    });

    it('calls a transform function', function () {
      multi.applyTransform(transform);
      expect(transform.calledOnce).to.be(true);
      const args = transform.firstCall.args;
      expect(args).to.have.length(3);

      expect(args[0]).to.be(multi.getFlatCoordinates()); // input coords
      expect(args[1]).to.be(multi.getFlatCoordinates()); // output coords
      expect(args[2]).to.be(2); // dimension
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
      expect(multi.getCoordinates()).to.eql([
        [2, 1],
        [4, 3],
      ]);
    });

    it('returns undefined', function () {
      const got = multi.applyTransform(transform);
      expect(got).to.be(undefined);
    });
  });

  describe('#transform()', function () {
    it('transforms a geometry given CRS identifiers', function () {
      const multi = new MultiPoint([
        [-111, 45],
        [111, -45],
      ]).transform('EPSG:4326', 'EPSG:3857');

      expect(multi).to.be.a(MultiPoint);

      const coords = multi.getCoordinates();

      expect(coords[0][0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[0][1]).to.roughlyEqual(5621521.48, 1e-2);

      expect(coords[1][0]).to.roughlyEqual(12356463.47, 1e-2);
      expect(coords[1][1]).to.roughlyEqual(-5621521.48, 1e-2);
    });
  });

  describe('#containsXY()', function () {
    it('does contain XY', function () {
      const multi = new MultiPoint([
        [1, 2],
        [10, 20],
      ]);

      expect(multi.containsXY(1, 2)).to.be(true);
      expect(multi.containsXY(10, 20)).to.be(true);
    });

    it('does not contain XY', function () {
      const multi = new MultiPoint([
        [1, 2],
        [10, 20],
      ]);

      expect(multi.containsXY(1, 3)).to.be(false);
      expect(multi.containsXY(2, 2)).to.be(false);
      expect(multi.containsXY(2, 3)).to.be(false);

      expect(multi.containsXY(10, 30)).to.be(false);
      expect(multi.containsXY(20, 20)).to.be(false);
      expect(multi.containsXY(20, 30)).to.be(false);
    });
  });
});
