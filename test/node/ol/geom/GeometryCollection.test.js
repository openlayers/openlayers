import Geometry from '../../../../src/ol/geom/Geometry.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import expect from '../../expect.js';
import sinon from 'sinon';

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
      expect(multi).to.be.a(GeometryCollection);
      expect(multi).to.be.a(Geometry);
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
        expect().fail();
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
      expect(geometries).to.be.an(Array);
      expect(geometries).to.have.length(3);
      expect(geometries[0]).to.be.a(Point);
      expect(geometries[1]).to.be.a(LineString);
      expect(geometries[2]).to.be.a(Polygon);
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
      expect(clone).to.not.be(multi);
      const geometries = clone.getGeometries();
      expect(geometries[0].getCoordinates()).to.eql([10, 20]);
      expect(geometries[1].getCoordinates()).to.eql([
        [10, 20],
        [30, 40],
      ]);
      expect(geometries[2].getCoordinates()).to.eql([outer, inner1, inner2]);
      expect(clone.getProperties()).to.eql({foo: 'bar', baz: null});
    });

    it('does a deep clone', function () {
      const point = new Point([30, 40]);
      const originalGeometries = [point];
      const multi = new GeometryCollection(originalGeometries);
      const clone = multi.clone();
      const clonedGeometries = clone.getGeometries();
      expect(clonedGeometries).not.to.be(originalGeometries);
      expect(clonedGeometries).to.have.length(originalGeometries.length);
      expect(clonedGeometries).to.have.length(1);
      expect(clonedGeometries[0]).not.to.be(originalGeometries[0]);
      expect(clonedGeometries[0].getCoordinates()).to.eql(
        originalGeometries[0].getCoordinates()
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
      expect(extent[0]).to.be(1);
      expect(extent[2]).to.be(30);
      expect(extent[1]).to.be(2);
      expect(extent[3]).to.be(40);
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
      expect(multi.intersectsExtent([5, 20, 5, 20])).to.be(true);
    });

    it('returns true for intersecting part of lineString', function () {
      expect(multi.intersectsExtent([25, 35, 30, 40])).to.be(true);
    });

    it('returns true for intersecting part of polygon', function () {
      expect(multi.intersectsExtent([0, 0, 5, 5])).to.be(true);
    });

    it('returns false for non-matching extent within own extent', function () {
      const extent = [0, 35, 5, 40];
      expect(poly.intersectsExtent(extent)).to.be(false);
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
      const listener = sinon.spy();
      multi.on('change', listener);
      multi.setGeometries([point, line, poly]);
      expect(listener.calledOnce).to.be(true);
    });

    it('updates the extent', function () {
      expect(multi.getExtent()).to.eql([0, 0, 30, 40]);
      line.setCoordinates([
        [10, 20],
        [300, 400],
      ]);
      expect(multi.getExtent()).to.eql([0, 0, 300, 400]);
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
      expect(geometries[0].getCoordinates()).to.eql([-10, -20]);
      expect(geometries[1].getCoordinates()).to.eql([
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
      expect(geometries[0].getCoordinates()).to.eql([-2, -6]);
      expect(geometries[1].getCoordinates()).to.eql([
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
      expect(geometries[0].getCoordinates()).to.eql([-1, -2]);
      expect(geometries[1].getCoordinates()).to.eql([
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
      expect(geometries[0]).to.be.a(Point);
      expect(geometries[1]).to.be.a(LineString);

      let coords = geometries[0].getCoordinates();
      expect(coords[0]).to.roughlyEqual(1113194.9, 1e-2);
      expect(coords[1]).to.roughlyEqual(2273030.92, 1e-2);

      coords = geometries[1].getCoordinates();
      expect(coords[0][0]).to.roughlyEqual(1113194.9, 1e-2);
      expect(coords[0][1]).to.roughlyEqual(2273030.92, 1e-2);
      expect(coords[1][0]).to.roughlyEqual(3339584.72, 1e-2);
      expect(coords[1][1]).to.roughlyEqual(4865942.27, 1e-2);
    });
  });
});
