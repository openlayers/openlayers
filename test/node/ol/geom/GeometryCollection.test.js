import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Geometry from '../../../../src/ol/geom/Geometry.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';

describe('ol/geom/GeometryCollection.js', function () {
  const outer = [
    [0, 0],
    [0, 10],
    [10, 10],
    [10, 0],
    [0, 0],
  ];
  const inner1 = [
    [1, 1],
    [2, 1],
    [2, 2],
    [1, 2],
    [1, 1],
  ];
  const inner2 = [
    [8, 8],
    [9, 8],
    [9, 9],
    [8, 9],
    [8, 8],
  ];

  describe('constructor', function () {
    let line, multi, point, poly;
    beforeEach(function () {
      point = new Point([10, 20]);
      line = new LineString([
        [10, 20],
        [30, 40],
      ]);
      poly = new Polygon([outer, inner1, inner2]);
      multi = new GeometryCollection([point, line, poly]);
    });

    it('creates a geometry collection from an array of geometries', function () {
      assert.instanceOf(multi, GeometryCollection);
      assert.instanceOf(multi, Geometry);
    });

    it('fires a change event when one of its component changes', function (done) {
      multi.on('change', function () {
        done();
      });
      point.setCoordinates([10, 10]);
    });

    it('deregister old components', function () {
      multi.setGeometries([poly]);
      multi.on('change', function () {
        assert.fail();
      });
      point.setCoordinates([10, 10]);
    });

    it('register new components', function (done) {
      const point2 = new Point([10, 20]);
      multi.setGeometriesArray([point2]);
      multi.on('change', function () {
        done();
      });
      point2.setCoordinates([10, 10]);
    });
  });

  describe('#getGeometries', function () {
    it('returns a collection of geometries', function () {
      const point = new Point([10, 20]);
      const line = new LineString([
        [10, 20],
        [30, 40],
      ]);
      const poly = new Polygon([outer, inner1, inner2]);
      const multi = new GeometryCollection([point, line, poly]);

      const geometries = multi.getGeometries();
      assert.instanceOf(geometries, Array);
      assert.lengthOf(geometries, 3);
      assert.instanceOf(geometries[0], Point);
      assert.instanceOf(geometries[1], LineString);
      assert.instanceOf(geometries[2], Polygon);
    });
  });

  describe('#clone()', function () {
    it('has a working clone method', function () {
      const point = new Point([10, 20]);
      const line = new LineString([
        [10, 20],
        [30, 40],
      ]);
      const poly = new Polygon([outer, inner1, inner2]);
      const multi = new GeometryCollection([point, line, poly]);
      multi.setProperties({foo: 'bar', baz: null});
      const clone = multi.clone();
      assert.notEqual(clone, multi);
      const geometries = clone.getGeometries();
      assert.deepEqual(geometries[0].getCoordinates(), [10, 20]);
      assert.deepEqual(geometries[1].getCoordinates(), [
        [10, 20],
        [30, 40],
      ]);
      assert.deepEqual(geometries[2].getCoordinates(), [outer, inner1, inner2]);
      assert.deepEqual(clone.getProperties(), {foo: 'bar', baz: null});
    });

    it('does a deep clone', function () {
      const point = new Point([30, 40]);
      const originalGeometries = [point];
      const multi = new GeometryCollection(originalGeometries);
      const clone = multi.clone();
      const clonedGeometries = clone.getGeometries();
      assert.notEqual(clonedGeometries, originalGeometries);
      assert.lengthOf(clonedGeometries, originalGeometries.length);
      assert.lengthOf(clonedGeometries, 1);
      assert.notEqual(clonedGeometries[0], originalGeometries[0]);
      assert.deepEqual(
        clonedGeometries[0].getCoordinates(),
        originalGeometries[0].getCoordinates(),
      );
    });
  });

  describe('#getExtent()', function () {
    it('returns the bounding extent', function () {
      const point = new Point([10, 2]);
      const line = new LineString([
        [1, 20],
        [30, 40],
      ]);
      const multi = new GeometryCollection([point, line]);
      const extent = multi.getExtent();
      assert.strictEqual(extent[0], 1);
      assert.strictEqual(extent[2], 30);
      assert.strictEqual(extent[1], 2);
      assert.strictEqual(extent[3], 40);
    });
  });

  describe('#intersectsExtent()', function () {
    let point, line, poly, multi;

    beforeEach(function () {
      point = new Point([5, 20]);
      line = new LineString([
        [10, 20],
        [30, 40],
      ]);
      poly = new Polygon([outer, inner1, inner2]);
      multi = new GeometryCollection([point, line, poly]);
    });

    it('returns true for intersecting point', function () {
      assert.strictEqual(multi.intersectsExtent([5, 20, 5, 20]), true);
    });

    it('returns true for intersecting part of lineString', function () {
      assert.strictEqual(multi.intersectsExtent([25, 35, 30, 40]), true);
    });

    it('returns true for intersecting part of polygon', function () {
      assert.strictEqual(multi.intersectsExtent([0, 0, 5, 5]), true);
    });

    it('returns false for non-matching extent within own extent', function () {
      const extent = [0, 35, 5, 40];
      assert.strictEqual(poly.intersectsExtent(extent), false);
    });
  });

  describe('#setGeometries', function () {
    let line, multi, point, poly;
    beforeEach(function () {
      point = new Point([10, 20]);
      line = new LineString([
        [10, 20],
        [30, 40],
      ]);
      poly = new Polygon([outer, inner1, inner2]);
      multi = new GeometryCollection([point, line, poly]);
    });

    it('fires a change event', function () {
      const listener = sinonSpy();
      multi.on('change', listener);
      multi.setGeometries([point, line, poly]);
      assert.strictEqual(listener.calledOnce, true);
    });

    it('updates the extent', function () {
      assert.deepEqual(multi.getExtent(), [0, 0, 30, 40]);
      line.setCoordinates([
        [10, 20],
        [300, 400],
      ]);
      assert.deepEqual(multi.getExtent(), [0, 0, 300, 400]);
    });
  });

  describe('#scale()', function () {
    it('scales a collection', function () {
      const geom = new GeometryCollection([
        new Point([-1, -2]),
        new LineString([
          [0, 0],
          [1, 2],
        ]),
      ]);
      geom.scale(10);
      const geometries = geom.getGeometries();
      assert.deepEqual(geometries[0].getCoordinates(), [-10, -20]);
      assert.deepEqual(geometries[1].getCoordinates(), [
        [0, 0],
        [10, 20],
      ]);
    });

    it('accepts sx and sy', function () {
      const geom = new GeometryCollection([
        new Point([-1, -2]),
        new LineString([
          [0, 0],
          [1, 2],
        ]),
      ]);
      geom.scale(2, 3);
      const geometries = geom.getGeometries();
      assert.deepEqual(geometries[0].getCoordinates(), [-2, -6]);
      assert.deepEqual(geometries[1].getCoordinates(), [
        [0, 0],
        [2, 6],
      ]);
    });

    it('accepts an anchor', function () {
      const geom = new GeometryCollection([
        new Point([-1, -2]),
        new LineString([
          [0, 0],
          [1, 2],
        ]),
      ]);
      geom.scale(10, 15, [-1, -2]);
      const geometries = geom.getGeometries();
      assert.deepEqual(geometries[0].getCoordinates(), [-1, -2]);
      assert.deepEqual(geometries[1].getCoordinates(), [
        [9, 28],
        [19, 58],
      ]);
    });
  });

  describe('#transform()', function () {
    let line, multi, point;
    beforeEach(function () {
      point = new Point([10, 20]);
      line = new LineString([
        [10, 20],
        [30, 40],
      ]);
      multi = new GeometryCollection([point, line]);
    });

    it('transforms all geometries', function () {
      multi.transform('EPSG:4326', 'EPSG:3857');

      const geometries = multi.getGeometries();
      assert.instanceOf(geometries[0], Point);
      assert.instanceOf(geometries[1], LineString);

      let coords = geometries[0].getCoordinates();
      assert.approximately(coords[0], 1113194.9, 1e-2);
      assert.approximately(coords[1], 2273030.92, 1e-2);

      coords = geometries[1].getCoordinates();
      assert.approximately(coords[0][0], 1113194.9, 1e-2);
      assert.approximately(coords[0][1], 2273030.92, 1e-2);
      assert.approximately(coords[1][0], 3339584.72, 1e-2);
      assert.approximately(coords[1][1], 4865942.27, 1e-2);
    });
  });
});
