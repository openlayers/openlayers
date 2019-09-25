import Geometry from '../../../../src/ol/geom/Geometry.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';

describe('ol.geom.GeometryCollection', () => {

  const outer = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
  const inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
  const inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];

  describe('constructor', () => {

    let line, multi, point, poly;
    beforeEach(() => {
      point = new Point([10, 20]);
      line = new LineString([[10, 20], [30, 40]]);
      poly = new Polygon([outer, inner1, inner2]);
      multi = new GeometryCollection([point, line, poly]);
    });

    test('creates a geometry collection from an array of geometries', () => {
      expect(multi).toBeInstanceOf(GeometryCollection);
      expect(multi).toBeInstanceOf(Geometry);
    });

    test('fires a change event when one of its component changes', done => {
      multi.on('change', function() {
        done();
      });
      point.setCoordinates([10, 10]);
    });

    test('deregister old components', () => {
      multi.setGeometries([poly]);
      multi.on('change', function() {
        throw Error();
      });
      point.setCoordinates([10, 10]);
    });

    test('register new components', done => {
      const point2 = new Point([10, 20]);
      multi.setGeometriesArray([point2]);
      multi.on('change', function() {
        done();
      });
      point2.setCoordinates([10, 10]);
    });

  });

  describe('#getGeometries', () => {

    test('returns a collection of geometries', () => {
      const point = new Point([10, 20]);
      const line = new LineString([[10, 20], [30, 40]]);
      const poly = new Polygon([outer, inner1, inner2]);
      const multi = new GeometryCollection([point, line, poly]);

      const geometries = multi.getGeometries();
      expect(geometries).toBeInstanceOf(Array);
      expect(geometries).toHaveLength(3);
      expect(geometries[0]).toBeInstanceOf(Point);
      expect(geometries[1]).toBeInstanceOf(LineString);
      expect(geometries[2]).toBeInstanceOf(Polygon);
    });

  });

  describe('#clone()', () => {

    test('has a working clone method', () => {
      const point = new Point([10, 20]);
      const line = new LineString([[10, 20], [30, 40]]);
      const poly = new Polygon([outer, inner1, inner2]);
      const multi = new GeometryCollection([point, line, poly]);
      const clone = multi.clone();
      expect(clone).not.toBe(multi);
      const geometries = clone.getGeometries();
      expect(geometries[0].getCoordinates()).toEqual([10, 20]);
      expect(geometries[1].getCoordinates()).toEqual([[10, 20], [30, 40]]);
      expect(geometries[2].getCoordinates()).toEqual([outer, inner1, inner2]);
    });

    test('does a deep clone', () => {
      const point = new Point([30, 40]);
      const originalGeometries = [point];
      const multi = new GeometryCollection(originalGeometries);
      const clone = multi.clone();
      const clonedGeometries = clone.getGeometries();
      expect(clonedGeometries).not.toBe(originalGeometries);
      expect(clonedGeometries).toHaveLength(originalGeometries.length);
      expect(clonedGeometries).toHaveLength(1);
      expect(clonedGeometries[0]).not.toBe(originalGeometries[0]);
      expect(clonedGeometries[0].getCoordinates()).toEqual(originalGeometries[0].getCoordinates());
    });

  });

  describe('#getExtent()', () => {

    test('returns the bounding extent', () => {
      const point = new Point([10, 2]);
      const line = new LineString([[1, 20], [30, 40]]);
      const multi = new GeometryCollection([point, line]);
      const extent = multi.getExtent();
      expect(extent[0]).toBe(1);
      expect(extent[2]).toBe(30);
      expect(extent[1]).toBe(2);
      expect(extent[3]).toBe(40);
    });

  });

  describe('#intersectsExtent()', () => {

    let point, line, poly, multi;

    beforeEach(() => {
      point = new Point([5, 20]);
      line = new LineString([[10, 20], [30, 40]]);
      poly = new Polygon([outer, inner1, inner2]);
      multi = new GeometryCollection([point, line, poly]);
    });

    test('returns true for intersecting point', () => {
      expect(multi.intersectsExtent([5, 20, 5, 20])).toBe(true);
    });

    test('returns true for intersecting part of lineString', () => {
      expect(multi.intersectsExtent([25, 35, 30, 40])).toBe(true);
    });

    test('returns true for intersecting part of polygon', () => {
      expect(multi.intersectsExtent([0, 0, 5, 5])).toBe(true);
    });

    test('returns false for non-matching extent within own extent', () => {
      const extent = [0, 35, 5, 40];
      expect(poly.intersectsExtent(extent)).toBe(false);
    });

  });

  describe('#setGeometries', () => {

    let line, multi, point, poly;
    beforeEach(() => {
      point = new Point([10, 20]);
      line = new LineString([[10, 20], [30, 40]]);
      poly = new Polygon([outer, inner1, inner2]);
      multi = new GeometryCollection([point, line, poly]);
    });

    test('fires a change event', () => {
      const listener = sinon.spy();
      multi.on('change', listener);
      multi.setGeometries([point, line, poly]);
      expect(listener.calledOnce).toBe(true);
    });

    test('updates the extent', () => {
      expect(multi.getExtent()).toEqual([0, 0, 30, 40]);
      line.setCoordinates([[10, 20], [300, 400]]);
      expect(multi.getExtent()).toEqual([0, 0, 300, 400]);
    });

  });

  describe('#scale()', () => {

    test('scales a collection', () => {
      const geom = new GeometryCollection([
        new Point([-1, -2]),
        new LineString([[0, 0], [1, 2]])
      ]);
      geom.scale(10);
      const geometries = geom.getGeometries();
      expect(geometries[0].getCoordinates()).toEqual([-10, -20]);
      expect(geometries[1].getCoordinates()).toEqual([[0, 0], [10, 20]]);
    });

    test('accepts sx and sy', () => {
      const geom = new GeometryCollection([
        new Point([-1, -2]),
        new LineString([[0, 0], [1, 2]])
      ]);
      geom.scale(2, 3);
      const geometries = geom.getGeometries();
      expect(geometries[0].getCoordinates()).toEqual([-2, -6]);
      expect(geometries[1].getCoordinates()).toEqual([[0, 0], [2, 6]]);
    });

    test('accepts an anchor', () => {
      const geom = new GeometryCollection([
        new Point([-1, -2]),
        new LineString([[0, 0], [1, 2]])
      ]);
      geom.scale(10, 15, [-1, -2]);
      const geometries = geom.getGeometries();
      expect(geometries[0].getCoordinates()).toEqual([-1, -2]);
      expect(geometries[1].getCoordinates()).toEqual([[9, 28], [19, 58]]);
    });

  });

  describe('#transform()', () => {

    let line, multi, point;
    beforeEach(() => {
      point = new Point([10, 20]);
      line = new LineString([[10, 20], [30, 40]]);
      multi = new GeometryCollection([point, line]);
    });

    test('transforms all geometries', () => {
      multi.transform('EPSG:4326', 'EPSG:3857');

      const geometries = multi.getGeometries();
      expect(geometries[0]).toBeInstanceOf(Point);
      expect(geometries[1]).toBeInstanceOf(LineString);

      let coords = geometries[0].getCoordinates();
      expect(coords[0]).to.roughlyEqual(1113194.90, 1e-2);
      expect(coords[1]).to.roughlyEqual(2273030.92, 1e-2);

      coords = geometries[1].getCoordinates();
      expect(coords[0][0]).to.roughlyEqual(1113194.90, 1e-2);
      expect(coords[0][1]).to.roughlyEqual(2273030.92, 1e-2);
      expect(coords[1][0]).to.roughlyEqual(3339584.72, 1e-2);
      expect(coords[1][1]).to.roughlyEqual(4865942.27, 1e-2);
    });

  });

});
