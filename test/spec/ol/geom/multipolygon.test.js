import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';


describe('ol.geom.MultiPolygon', () => {

  test('cannot be constructed with a null geometry', () => {
    expect(function() {
      return new MultiPolygon(null);
    }).toThrow();
  });

  describe('with a null MultiPolygon', () => {

    test('can append polygons', () => {
      const multiPolygon = new MultiPolygon([
        new Polygon([[[0, 0], [0, 2], [1, 1], [2, 0]]])]);
      expect(multiPolygon.getCoordinates()).toEqual([[[[0, 0], [0, 2], [1, 1], [2, 0]]]]);
      multiPolygon.appendPolygon(
        new Polygon([[[3, 0], [4, 1], [5, 2], [5, 0]]]));
      expect(multiPolygon.getCoordinates()).toEqual([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
      expect(multiPolygon.getPolygons().length).toEqual(2);
    });

  });

  describe('with an empty MultiPolygon', () => {

    let multiPolygon;
    beforeEach(() => {
      multiPolygon = new MultiPolygon([]);
    });

    test('can append polygons', () => {
      multiPolygon.appendPolygon(
        new Polygon([[[0, 0], [0, 2], [1, 1], [2, 0]]]));
      expect(multiPolygon.getCoordinates()).toEqual([[[[0, 0], [0, 2], [1, 1], [2, 0]]]]);
      multiPolygon.appendPolygon(
        new Polygon([[[3, 0], [4, 1], [5, 2], [5, 0]]]));
      expect(multiPolygon.getCoordinates()).toEqual([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
      expect(multiPolygon.getPolygons().length).toEqual(2);
    });

  });

  describe('#scale()', () => {

    test('scales a multi-polygon', () => {
      const geom = new MultiPolygon([[
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[[-10, -20], [10, -20], [10, 20], [-10, 20], [-10, -20]]]]);
    });

    test('accepts sx and sy', () => {
      const geom = new MultiPolygon([[
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[[-2, -6], [2, -6], [2, 6], [-2, 6], [-2, -6]]]]);
    });

    test('accepts an anchor', () => {
      const geom = new MultiPolygon([[
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]]);
      geom.scale(3, 2, [-1, -2]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[[-1, -2], [5, -2], [5, 6], [-1, 6], [-1, -2]]]]);
    });

  });

  describe('with a simple MultiPolygon', () => {

    let multiPolygon;
    beforeEach(() => {
      multiPolygon = new MultiPolygon([
        [[[0, 0], [0, 2], [1, 1], [2, 0]]],
        [[[3, 0], [4, 1], [5, 2], [5, 0]]]
      ]);
    });

    test('can return individual polygons', () => {
      const polygon0 = multiPolygon.getPolygon(0);
      expect(polygon0).toBeInstanceOf(Polygon);
      expect(polygon0.getCoordinates()).toEqual([[[0, 0], [0, 2], [1, 1], [2, 0]]]);
      const polygon1 = multiPolygon.getPolygon(1);
      expect(polygon1).toBeInstanceOf(Polygon);
      expect(polygon1.getCoordinates()).toEqual([[[3, 0], [4, 1], [5, 2], [5, 0]]]);
    });

    test('can return all polygons', () => {
      const polygons = multiPolygon.getPolygons();
      expect(polygons).toBeInstanceOf(Array);
      expect(polygons).toHaveLength(2);
      expect(polygons[0]).toBeInstanceOf(Polygon);
      expect(polygons[0].getCoordinates()).toEqual([[[0, 0], [0, 2], [1, 1], [2, 0]]]);
      expect(polygons[1]).toBeInstanceOf(Polygon);
      expect(polygons[1].getCoordinates()).toEqual([[[3, 0], [4, 1], [5, 2], [5, 0]]]);
    });

    describe('#clone()', () => {

      test('has the expected endss_', () => {
        const clone = multiPolygon.clone();
        expect(multiPolygon.endss_).toEqual(clone.endss_);
      });

    });

    describe('#getCoordinates()', () => {

      const cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      const cw2 = [[-140, -60], [-140, 60], [140, 60], [140, -60], [-140, -60]];
      const ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      const ccw2 = [[-140, -60], [140, -60], [140, 60], [-140, 60], [-140, -60]];
      const right = new MultiPolygon([[ccw, cw], [ccw2, cw2]]);
      const left = new MultiPolygon([[cw, ccw], [cw2, ccw2]]);

      test('returns coordinates as they were constructed', () => {
        expect(right.getCoordinates()).toEqual([[ccw, cw], [ccw2, cw2]]);
        expect(left.getCoordinates()).toEqual([[cw, ccw], [cw2, ccw2]]);
      });

      test('can return coordinates with right-hand orientation', () => {
        expect(right.getCoordinates(true)).toEqual([[ccw, cw], [ccw2, cw2]]);
        expect(left.getCoordinates(true)).toEqual([[ccw, cw], [ccw2, cw2]]);
      });

      test('can return coordinates with left-hand orientation', () => {
        expect(right.getCoordinates(false)).toEqual([[cw, ccw], [cw2, ccw2]]);
        expect(left.getCoordinates(false)).toEqual([[cw, ccw], [cw2, ccw2]]);
      });

    });

    describe('#getExtent()', () => {

      test('returns expected result', () => {
        expect(multiPolygon.getExtent()).toEqual([0, 0, 5, 2]);
      });

    });

    describe('#getSimplifiedGeometry', () => {

      test('returns the expected result', () => {
        const simplifiedGeometry = multiPolygon.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).toBeInstanceOf(MultiPolygon);
        expect(simplifiedGeometry.getCoordinates()).toEqual([
          [[[0, 0], [0, 2], [2, 0]]],
          [[[3, 0], [5, 2], [5, 0]]]
        ]);
      });
    });

    describe('#intersectsExtent()', () => {

      test('returns true for extent of of each polygon', () => {
        const polygons = multiPolygon.getPolygons();
        for (let i = 0; i < polygons.length; i++) {
          expect(multiPolygon.intersectsExtent(
            polygons[i].getExtent())).toBe(true);
        }
      });

      test('returns false for non-matching extent within own extent', () => {
        expect(multiPolygon.intersectsExtent([2.1, 0, 2.9, 2])).toBe(false);
      });

    });

  });

  describe('#getArea', () => {

    test('works with a clockwise and a counterclockwise Polygon', () => {
      const multiPolygon = new MultiPolygon([
        [[[1, 3], [1, 2], [0, 2], [1, 3]]], // clockwise polygon with area 0.5
        [[[2, 1], [2, 0.5], [3, 1], [2, 1]]] // counterclockwise polygon with area 0.25
      ]);
      expect(multiPolygon.getArea()).toBe(0.75);
    });
  });

  describe('#getInteriorPoints', () => {

    test('returns XYM multipoint with intersection width as M', () => {
      const geom = new MultiPolygon([
        [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
        [[[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]
      ]);
      const interiorPoints = geom.getInteriorPoints();
      expect(interiorPoints.getType()).toBe('MultiPoint');
      expect(interiorPoints.layout).toBe('XYM');
      expect(interiorPoints.getCoordinates()).toEqual([[0.5, 0.5, 1], [1.5, 1.5, 1]]);
    });
  });

});
