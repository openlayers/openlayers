import proj4 from 'proj4';
import {spy as sinonSpy} from 'sinon';
import Point from '../../../../src/ol/geom/Point.js';
import {register, unregister} from '../../../../src/ol/proj/proj4.js';
import {
  get as getProjection,
  getTransformFromProjections,
} from '../../../../src/ol/proj.js';
import expect from '../../expect.js';

describe('ol/geom/Point.js', function () {
  it('cannot be constructed with a null geometry', function () {
    expect(function () {
      return new Point(null);
    }).to.throwException();
  });

  describe('construct with 2D coordinates', function () {
    let point;
    beforeEach(function () {
      point = new Point([1, 2]);
    });

    it('has the expected layout', function () {
      expect(point.getLayout()).to.be('XY');
    });

    it('has the expected coordinates', function () {
      expect(point.getCoordinates()).to.eql([1, 2]);
    });

    it('has the expected extent', function () {
      expect(point.getExtent()).to.eql([1, 2, 1, 2]);
    });

    it('has the expected flat coordinates', function () {
      expect(point.getFlatCoordinates()).to.eql([1, 2]);
    });

    it('has stride the expected stride', function () {
      expect(point.getStride()).to.be(2);
    });

    it('does not intersect non matching extent', function () {
      expect(point.intersectsExtent([0, 0, 10, 0.5])).to.be(false);
    });

    it("does intersect it's extent", function () {
      expect(point.intersectsExtent(point.getExtent())).to.be(true);
    });
  });

  describe('construct with 3D coordinates and layout XYM', function () {
    let point;
    beforeEach(function () {
      point = new Point([1, 2, 3], 'XYM');
    });

    it('has the expected layout', function () {
      expect(point.getLayout()).to.be('XYM');
    });

    it('has the expected coordinates', function () {
      expect(point.getCoordinates()).to.eql([1, 2, 3]);
    });

    it('has the expected extent', function () {
      expect(point.getExtent()).to.eql([1, 2, 1, 2]);
    });

    it('has the expected flat coordinates', function () {
      expect(point.getFlatCoordinates()).to.eql([1, 2, 3]);
    });

    it('has the expected stride', function () {
      expect(point.getStride()).to.be(3);
    });

    it('does not intersect non matching extent', function () {
      expect(point.intersectsExtent([0, 0, 10, 0.5])).to.be(false);
    });

    it("does intersect it's extent", function () {
      expect(point.intersectsExtent(point.getExtent())).to.be(true);
    });
  });

  describe('construct with 4D coordinates', function () {
    let point;
    beforeEach(function () {
      point = new Point([1, 2, 3, 4]);
    });

    it('has the expected layout', function () {
      expect(point.getLayout()).to.be('XYZM');
    });

    it('has the expected coordinates', function () {
      expect(point.getCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected extent', function () {
      expect(point.getExtent()).to.eql([1, 2, 1, 2]);
    });

    it('has the expected flat coordinates', function () {
      expect(point.getFlatCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected stride', function () {
      expect(point.getStride()).to.be(4);
    });

    it('does not intersect non matching extent', function () {
      expect(point.intersectsExtent([0, 0, 10, 0.5])).to.be(false);
    });

    it("does intersect it's extent", function () {
      expect(point.intersectsExtent(point.getExtent())).to.be(true);
    });

    describe('#getClosestPoint', function () {
      it('preseves extra dimensions', function () {
        const closestPoint = point.getClosestPoint([0, 0]);
        expect(closestPoint).to.eql([1, 2, 3, 4]);
      });
    });
  });

  describe('#scale()', function () {
    it('scales a point', function () {
      const geom = new Point([1, 2]);
      geom.scale(10e6);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([1, 2]);
    });

    it('accepts sx and sy', function () {
      const geom = new Point([1, 2]);
      geom.scale(1e6, -42);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([1, 2]);
    });

    it('accepts an anchor', function () {
      const geom = new Point([1, 2]);
      geom.scale(10, 15, [0, 0]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).to.eql([10, 30]);
    });
  });

  describe('#simplifyTransformed()', function () {
    it('returns the same result if called twice with the same arguments', function () {
      const geom = new Point([1, 2]);
      const source = getProjection('EPSG:4326');
      const dest = getProjection('EPSG:3857');
      const transform = getTransformFromProjections(source, dest);
      const squaredTolerance = 0.5;
      const first = geom.simplifyTransformed(squaredTolerance, transform);
      const second = geom.simplifyTransformed(squaredTolerance, transform);
      expect(second).to.be(first);
    });

    it('returns a different result if called with a different tolerance', function () {
      const geom = new Point([1, 2]);
      const source = getProjection('EPSG:4326');
      const dest = getProjection('EPSG:3857');
      const transform = getTransformFromProjections(source, dest);
      const squaredTolerance = 0.5;
      const first = geom.simplifyTransformed(squaredTolerance, transform);
      const second = geom.simplifyTransformed(squaredTolerance * 2, transform);
      expect(second).not.to.be(first);
    });

    it('returns a different result if called after geometry modification', function () {
      const geom = new Point([1, 2]);
      const source = getProjection('EPSG:4326');
      const dest = getProjection('EPSG:3857');
      const transform = getTransformFromProjections(source, dest);
      const squaredTolerance = 0.5;
      const first = geom.simplifyTransformed(squaredTolerance, transform);

      geom.setCoordinates([3, 4]);
      const second = geom.simplifyTransformed(squaredTolerance * 2, transform);
      expect(second).not.to.be(first);
    });
  });

  describe('#applyTransform()', function () {
    let point, transform;
    beforeEach(function () {
      point = new Point([1, 2]);
      transform = sinonSpy();
    });

    it('calls a transform function', function () {
      point.applyTransform(transform);
      expect(transform.calledOnce).to.be(true);
      const args = transform.firstCall.args;
      expect(args).to.have.length(4);

      expect(args[0]).to.be(point.getFlatCoordinates()); // input coords
      expect(args[1]).to.be(point.getFlatCoordinates()); // output coords
      expect(args[2]).to.be(2); // dimension
      expect(args[3]).to.be(2); // stride
    });

    it('allows for modification of coordinates', function () {
      const mod = function (input, output, dimension) {
        const copy = input.slice();
        output[1] = copy[0];
        output[0] = copy[1];
      };
      point.applyTransform(mod);
      expect(point.getCoordinates()).to.eql([2, 1]);
    });

    it('returns undefined', function () {
      const got = point.applyTransform(transform);
      expect(got).to.be(undefined);
    });
  });

  describe('#transform()', function () {
    beforeEach(function () {
      proj4.defs(
        'EPSG:27700',
        '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
          '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs',
      );
      register(proj4);
    });
    afterEach(function () {
      unregister();
    });

    it('transforms a geometry given CRS identifiers', function () {
      const point = new Point([-111, 45]).transform('EPSG:4326', 'EPSG:3857');

      expect(point).to.be.a(Point);

      const coords = point.getCoordinates();

      expect(coords[0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[1]).to.roughlyEqual(5621521.48, 1e-2);
    });

    it('modifies the original', function () {
      const point = new Point([-111, 45]);
      point.transform('EPSG:4326', 'EPSG:3857');
      const coords = point.getCoordinates();

      expect(coords[0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[1]).to.roughlyEqual(5621521.48, 1e-2);
    });

    it('transforms 3 dimensions for `XYZ` layout', function () {
      const coordinates = [-4.004431525245309, 50.74081267230213, 1723304052];
      const pointXYZ = new Point(coordinates, 'XYZ');
      pointXYZ.transform('EPSG:4326', 'EPSG:27700');
      expect(pointXYZ.getCoordinates()).to.eql(
        proj4('EPSG:4326', 'EPSG:27700', coordinates),
      );
    });

    it('transforms 2 dimensions for `XYM` layout', function () {
      const coordinates = [-4.004431525245309, 50.74081267230213, 1723304052];
      const pointXYM = new Point(coordinates, 'XYM');
      pointXYM.transform('EPSG:4326', 'EPSG:27700');
      expect(pointXYM.getCoordinates()).to.eql([
        ...proj4('EPSG:4326', 'EPSG:27700', coordinates.slice(0, 2)),
        coordinates[2],
      ]);
    });
  });

  describe('#containsXY()', function () {
    it('does contain XY', function () {
      const point = new Point([1, 2]);

      expect(point.containsXY(1, 2)).to.be(true);
    });

    it('does not contain XY', function () {
      const point = new Point([1, 2]);

      expect(point.containsXY(1, 3)).to.be(false);
      expect(point.containsXY(2, 2)).to.be(false);
      expect(point.containsXY(2, 3)).to.be(false);
    });
  });
});
