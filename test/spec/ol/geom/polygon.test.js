import {isEmpty, boundingExtent} from '../../../../src/ol/extent.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import Polygon, {fromCircle, fromExtent} from '../../../../src/ol/geom/Polygon.js';


describe('ol/geom/Polygon', () => {

  test('cannot be constructed with a null geometry', () => {
    expect(function() {
      return new Polygon(null);
    }).toThrow();
  });

  describe('construct empty', () => {

    let polygon;
    beforeEach(() => {
      polygon = new Polygon([]);
    });

    test('defaults to layout XY', () => {
      expect(polygon.getLayout()).toBe('XY');
    });

    test('has empty coordinates', () => {
      expect(polygon.getCoordinates()).toHaveLength(0);
    });

    test('has an empty extent', () => {
      expect(isEmpty(polygon.getExtent())).toBe(true);
    });

    test('has empty flat coordinates', () => {
      expect(polygon.getFlatCoordinates()).toHaveLength(0);
    });

    test('has stride the expected stride', () => {
      expect(polygon.getStride()).toBe(2);
    });

    test('can append linear rings', () => {
      polygon.appendLinearRing(
        new LinearRing([[1, 2], [3, 4], [5, 6]]));
      expect(polygon.getCoordinates()).toEqual([[[1, 2], [3, 4], [5, 6]]]);
      polygon.appendLinearRing(
        new LinearRing([[7, 8], [9, 10], [11, 12]]));
      expect(polygon.getCoordinates()).toEqual([[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10], [11, 12]]]);
    });

  });

  describe('construct with 2D coordinates', () => {

    let outerRing, innerRing, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner;
    beforeEach(() => {
      outerRing = [[0, 1], [1, 4], [4, 3], [3, 0]];
      innerRing = [[2, 2], [3, 2], [3, 3], [2, 3]];
      polygon = new Polygon([outerRing, innerRing]);
      flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0, 2, 2, 3, 2, 3, 3, 2, 3];
      outsideOuter = [0, 4];
      inside = [1.5, 1.5];
      insideInner = [2.5, 3.5];
    });

    test('has the expected layout', () => {
      expect(polygon.getLayout()).toBe('XY');
    });

    test('has the expected coordinates', () => {
      expect(polygon.getCoordinates()).toEqual([outerRing, innerRing]);
    });

    test('has the expected extent', () => {
      expect(polygon.getExtent()).toEqual([0, 0, 4, 4]);
    });

    test('has the expected flat coordinates', () => {
      expect(polygon.getFlatCoordinates()).toEqual(flatCoordinates);
    });

    test('has stride the expected stride', () => {
      expect(polygon.getStride()).toBe(2);
    });

    test('can return individual rings', () => {
      expect(polygon.getLinearRing(0).getCoordinates()).toEqual(outerRing);
      expect(polygon.getLinearRing(1).getCoordinates()).toEqual(innerRing);
    });

    test('has the expected rings', () => {
      const linearRings = polygon.getLinearRings();
      expect(linearRings).toBeInstanceOf(Array);
      expect(linearRings).toHaveLength(2);
      expect(linearRings[0]).toBeInstanceOf(LinearRing);
      expect(linearRings[0].getCoordinates()).toEqual(outerRing);
      expect(linearRings[1]).toBeInstanceOf(LinearRing);
      expect(linearRings[1].getCoordinates()).toEqual(innerRing);
    });

    test('does not reverse any rings', () => {
      outerRing.reverse();
      innerRing.reverse();
      polygon = new Polygon([outerRing, innerRing]);
      const coordinates = polygon.getCoordinates();
      expect(coordinates[0]).toEqual(outerRing);
      expect(coordinates[1]).toEqual(innerRing);
    });

    test('does not contain outside coordinates', () => {
      expect(polygon.intersectsCoordinate(outsideOuter)).toBe(false);
    });

    test('does contain inside coordinates', () => {
      expect(polygon.intersectsCoordinate(inside)).toBe(true);
    });

    test('does not contain inside inner coordinates', () => {
      expect(polygon.intersectsCoordinate(insideInner)).toBe(false);
    });

    describe('#getCoordinates()', () => {

      const cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      const ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      const right = new Polygon([ccw, cw]);
      const left = new Polygon([cw, ccw]);

      test('returns coordinates as they were constructed', () => {
        expect(right.getCoordinates()).toEqual([ccw, cw]);
        expect(left.getCoordinates()).toEqual([cw, ccw]);
      });

      test('can return coordinates with right-hand orientation', () => {
        expect(right.getCoordinates(true)).toEqual([ccw, cw]);
        expect(left.getCoordinates(true)).toEqual([ccw, cw]);
      });

      test('can return coordinates with left-hand orientation', () => {
        expect(right.getCoordinates(false)).toEqual([cw, ccw]);
        expect(left.getCoordinates(false)).toEqual([cw, ccw]);
      });

    });

    describe('#getOrientedFlatCoordinates', () => {

      test('reverses the outer ring if necessary', () => {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses inner rings if necessary', () => {
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses all rings if necessary', () => {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

    });

  });

  describe('construct with 3D coordinates', () => {

    let outerRing, innerRing, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner;
    beforeEach(() => {
      outerRing = [[0, 0, 1], [4, 4, 2], [4, 0, 3]];
      innerRing = [[2, 1, 4], [3, 1, 5], [3, 2, 6]];
      polygon = new Polygon([outerRing, innerRing]);
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    test('has the expected layout', () => {
      expect(polygon.getLayout()).toBe('XYZ');
    });

    test('has the expected coordinates', () => {
      expect(polygon.getCoordinates()).toEqual([outerRing, innerRing]);
    });

    test('has the expected extent', () => {
      expect(polygon.getExtent()).toEqual([0, 0, 4, 4]);
    });

    test('has the expected flat coordinates', () => {
      expect(polygon.getFlatCoordinates()).toEqual(flatCoordinates);
    });

    test('has stride the expected stride', () => {
      expect(polygon.getStride()).toBe(3);
    });

    test('does not contain outside coordinates', () => {
      expect(polygon.intersectsCoordinate(outsideOuter)).toBe(false);
    });

    test('does contain inside coordinates', () => {
      expect(polygon.intersectsCoordinate(inside)).toBe(true);
    });

    test('does not contain inside inner coordinates', () => {
      expect(polygon.intersectsCoordinate(insideInner)).toBe(false);
    });

    describe('#intersectsExtent', () => {

      test('does not intersect outside extent', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([outsideOuter]))).toBe(false);
      });

      test('does intersect inside extent', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([inside]))).toBe(true);
      });

      test('does intersect boundary extent', () => {
        const firstMidX = (outerRing[0][0] + outerRing[1][0]) / 2;
        const firstMidY = (outerRing[0][1] + outerRing[1][1]) / 2;

        expect(polygon.intersectsExtent(boundingExtent([[firstMidX,
          firstMidY]]))).toBe(true);
      });

      test('does not intersect extent fully contained by inner ring', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([insideInner]))).toBe(false);
      });

    });

    describe('#getOrientedFlatCoordinates', () => {

      test('reverses the outer ring if necessary', () => {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses inner rings if necessary', () => {
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses all rings if necessary', () => {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

    });

  });

  describe('construct with 3D coordinates and layout XYM', () => {

    let outerRing, innerRing, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner;
    beforeEach(() => {
      outerRing = [[0, 0, 1], [4, 4, 2], [4, 0, 3]];
      innerRing = [[2, 1, 4], [3, 1, 5], [3, 2, 6]];
      polygon = new Polygon(
        [outerRing, innerRing], 'XYM');
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    test('has the expected layout', () => {
      expect(polygon.getLayout()).toBe('XYM');
    });

    test('has the expected coordinates', () => {
      expect(polygon.getCoordinates()).toEqual([outerRing, innerRing]);
    });

    test('has the expected extent', () => {
      expect(polygon.getExtent()).toEqual([0, 0, 4, 4]);
    });

    test('has the expected flat coordinates', () => {
      expect(polygon.getFlatCoordinates()).toEqual(flatCoordinates);
    });

    test('has stride the expected stride', () => {
      expect(polygon.getStride()).toBe(3);
    });

    test('does not contain outside coordinates', () => {
      expect(polygon.intersectsCoordinate(outsideOuter)).toBe(false);
    });

    test('does contain inside coordinates', () => {
      expect(polygon.intersectsCoordinate(inside)).toBe(true);
    });

    test('does not contain inside inner coordinates', () => {
      expect(polygon.intersectsCoordinate(insideInner)).toBe(false);
    });

    describe('#intersectsExtent', () => {

      test('does not intersect outside extent', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([outsideOuter]))).toBe(false);
      });

      test('does intersect inside extent', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([inside]))).toBe(true);
      });

      test('does intersect boundary extent', () => {
        const firstMidX = (outerRing[0][0] + outerRing[1][0]) / 2;
        const firstMidY = (outerRing[0][1] + outerRing[1][1]) / 2;

        expect(polygon.intersectsExtent(boundingExtent([[firstMidX,
          firstMidY]]))).toBe(true);
      });

      test('does not intersect extent fully contained by inner ring', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([insideInner]))).toBe(false);
      });

    });

    describe('#getOrientedFlatCoordinates', () => {

      test('reverses the outer ring if necessary', () => {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses inner rings if necessary', () => {
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses all rings if necessary', () => {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

    });

  });

  describe('construct with 4D coordinates', () => {

    let outerRing, innerRing1, innerRing2, polygon, flatCoordinates;
    let outsideOuter, inside, insideInner1, insideInner2;
    beforeEach(() => {
      outerRing = [[0, 6, 1, 2], [6, 6, 3, 4], [3, 0, 5, 6]];
      innerRing1 =
          [[2, 4, 7, 8], [4, 4, 9, 10], [4, 5, 11, 12], [2, 5, 13, 14]];
      innerRing2 = [[3, 2, 15, 16], [4, 3, 17, 18], [2, 3, 19, 20]];
      polygon = new Polygon([outerRing, innerRing1, innerRing2]);
      flatCoordinates = [
        0, 6, 1, 2, 6, 6, 3, 4, 3, 0, 5, 6,
        2, 4, 7, 8, 4, 4, 9, 10, 4, 5, 11, 12, 2, 5, 13, 14,
        3, 2, 15, 16, 4, 3, 17, 18, 2, 3, 19, 20
      ];
      outsideOuter = [1, 1];
      inside = [3, 1];
      insideInner1 = [2.5, 4.5];
      insideInner2 = [3, 2.5];
    });

    test('has the expected layout', () => {
      expect(polygon.getLayout()).toBe('XYZM');
    });

    test('has the expected coordinates', () => {
      expect(polygon.getCoordinates()).toEqual([outerRing, innerRing1, innerRing2]);
    });

    test('has the expected extent', () => {
      expect(polygon.getExtent()).toEqual([0, 0, 6, 6]);
    });

    test('has the expected flat coordinates', () => {
      expect(polygon.getFlatCoordinates()).toEqual(flatCoordinates);
    });

    test('has stride the expected stride', () => {
      expect(polygon.getStride()).toBe(4);
    });

    test('does not contain outside coordinates', () => {
      expect(polygon.intersectsCoordinate(outsideOuter)).toBe(false);
    });

    test('does contain inside coordinates', () => {
      expect(polygon.intersectsCoordinate(inside)).toBe(true);
    });

    test('does not contain inside inner coordinates', () => {
      expect(polygon.intersectsCoordinate(insideInner1)).toBe(false);
      expect(polygon.intersectsCoordinate(insideInner2)).toBe(false);
    });

    describe('#intersectsExtent', () => {

      test('does not intersect outside extent', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([outsideOuter]))).toBe(false);
      });

      test('does intersect inside extent', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([inside]))).toBe(true);
      });

      test('does intersect boundary extent', () => {
        const firstMidX = (outerRing[0][0] + outerRing[1][0]) / 2;
        const firstMidY = (outerRing[0][1] + outerRing[1][1]) / 2;

        expect(polygon.intersectsExtent(boundingExtent([[firstMidX,
          firstMidY]]))).toBe(true);
      });

      test('does not intersect extent fully contained by inner ring', () => {
        expect(polygon.intersectsExtent(
          boundingExtent([insideInner1]))).toBe(false);
        expect(polygon.intersectsExtent(
          boundingExtent([insideInner2]))).toBe(false);
      });

    });

    describe('#getOrientedFlatCoordinates', () => {

      test('reverses the outer ring if necessary', () => {
        outerRing.reverse();
        polygon = new Polygon([outerRing, innerRing1, innerRing2]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses inner rings if necessary', () => {
        innerRing1.reverse();
        innerRing2.reverse();
        polygon = new Polygon([outerRing, innerRing1, innerRing2]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

      test('reverses all rings if necessary', () => {
        outerRing.reverse();
        innerRing1.reverse();
        innerRing2.reverse();
        polygon = new Polygon([outerRing, innerRing1, innerRing2]);
        expect(polygon.getOrientedFlatCoordinates()).toEqual(flatCoordinates);
      });

    });

  });

  describe('with a simple polygon', () => {

    let polygon;
    beforeEach(() => {
      polygon = new Polygon(
        [[[3, 0], [1, 3], [0, 6], [2, 6], [3, 7], [4, 6], [6, 6], [4, 3]]]);
    });

    describe('#getSimplifiedGeometry', () => {

      test('returns the expected result', () => {
        const simplifiedGeometry = polygon.getSimplifiedGeometry(9);
        expect(simplifiedGeometry).toBeInstanceOf(Polygon);
        expect(simplifiedGeometry.getCoordinates()).toEqual([[[3, 0], [0, 3], [0, 6], [6, 6], [3, 3]]]);
      });

    });
  });

  describe('#scale()', () => {

    test('scales a polygon', () => {
      const geom = new Polygon([
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]);
      geom.scale(10);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[-10, -20], [10, -20], [10, 20], [-10, 20], [-10, -20]]]);
    });

    test('accepts sx and sy', () => {
      const geom = new Polygon([
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]);
      geom.scale(2, 3);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[-2, -6], [2, -6], [2, 6], [-2, 6], [-2, -6]]]);
    });

    test('accepts an anchor', () => {
      const geom = new Polygon([
        [[-1, -2], [1, -2], [1, 2], [-1, 2], [-1, -2]]
      ]);
      geom.scale(3, 2, [-1, -2]);
      const coordinates = geom.getCoordinates();
      expect(coordinates).toEqual([[[-1, -2], [5, -2], [5, 6], [-1, 6], [-1, -2]]]);
    });

  });

  describe('#getInteriorPoint', () => {

    test('returns XYM point with intersection width as M', () => {
      const geom = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
      const interiorPoint = geom.getInteriorPoint();
      expect(interiorPoint.getType()).toBe('Point');
      expect(interiorPoint.layout).toBe('XYM');
      expect(interiorPoint.getCoordinates()).toEqual([0.5, 0.5, 1]);
    });

    test('returns XYM point for donut polygons', () => {
      const geom = new Polygon([
        [[0.5, 0.5], [0.5, 2.5], [2.5, 2.5], [2.5, 0.5], [0.5, 0.5]],
        [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]]
      ]);
      const interiorPoint = geom.getInteriorPoint();
      expect(interiorPoint.getType()).toBe('Point');
      expect(interiorPoint.layout).toBe('XYM');
      expect(interiorPoint.getCoordinates()).toEqual([0.75, 1.5, 0.5]);
    });
  });

  describe('fromExtent()', () => {
    test('creates the correct polygon', () => {
      const extent = [1, 2, 3, 5];
      const polygon = fromExtent(extent);
      const flatCoordinates = polygon.getFlatCoordinates();
      expect(flatCoordinates).toEqual([1, 2, 1, 5, 3, 5, 3, 2, 1, 2]);
      const orientedFlatCoordinates = polygon.getOrientedFlatCoordinates();
      expect(orientedFlatCoordinates).toEqual([1, 2, 1, 5, 3, 5, 3, 2, 1, 2]);
    });
  });

  describe('fromCircle()', () => {

    test('creates a regular polygon', () => {
      const circle = new Circle([0, 0, 0], 1, 'XYZ');
      const polygon = fromCircle(circle);
      const coordinates = polygon.getLinearRing(0).getCoordinates();
      expect(coordinates[0].length).toEqual(3);
      expect(coordinates[0][2]).toEqual(0);
      expect(coordinates[32]).toEqual(coordinates[0]);
      // east
      expect(coordinates[0][0]).to.roughlyEqual(1, 1e-9);
      expect(coordinates[0][1]).to.roughlyEqual(0, 1e-9);
      // south
      expect(coordinates[8][0]).to.roughlyEqual(0, 1e-9);
      expect(coordinates[8][1]).to.roughlyEqual(1, 1e-9);
      // west
      expect(coordinates[16][0]).to.roughlyEqual(-1, 1e-9);
      expect(coordinates[16][1]).to.roughlyEqual(0, 1e-9);
      // north
      expect(coordinates[24][0]).to.roughlyEqual(0, 1e-9);
      expect(coordinates[24][1]).to.roughlyEqual(-1, 1e-9);
    });

    test('creates a regular polygon with custom sides and angle', () => {
      const circle = new Circle([0, 0], 1);
      const polygon = fromCircle(circle, 4, Math.PI / 2);
      const coordinates = polygon.getLinearRing(0).getCoordinates();
      expect(coordinates[4]).toEqual(coordinates[0]);
      expect(coordinates[0][0]).to.roughlyEqual(0, 1e-9);
      expect(coordinates[0][1]).to.roughlyEqual(1, 1e-9);
    });

    test('creates a regular polygon, maintaining ZM values', () => {
      const circle = new Circle([0, 0, 1, 1], 1, 'XYZM');
      const polygon = fromCircle(circle);
      const coordinates = polygon.getLinearRing(0).getCoordinates();
      expect(coordinates[0][2]).toEqual(1);
      expect(coordinates[0][3]).toEqual(1);
    });
  });

});
