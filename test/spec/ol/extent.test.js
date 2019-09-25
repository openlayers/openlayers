import * as _ol_extent_ from '../../../src/ol/extent.js';
import {getTransform} from '../../../src/ol/proj.js';


describe('ol.extent', () => {

  describe('buffer', () => {

    test('buffers an extent by some value', () => {
      const extent = [-10, -20, 10, 20];
      expect(_ol_extent_.buffer(extent, 15)).toEqual([-25, -35, 25, 35]);
    });

  });

  describe('clone', () => {

    test('creates a copy of an extent', () => {
      const extent = _ol_extent_.createOrUpdate(1, 2, 3, 4);
      const clone = _ol_extent_.clone(extent);
      expect(_ol_extent_.equals(extent, clone)).toBe(true);

      _ol_extent_.extendCoordinate(extent, [10, 20]);
      expect(_ol_extent_.equals(extent, clone)).toBe(false);
    });

  });

  describe('closestSquaredDistanceXY', () => {

    test('returns correct result when x left of extent', () => {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = -2;
      const y = 0;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).toBe(4);
    });

    test('returns correct result when x right of extent', () => {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 3;
      const y = 0;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).toBe(4);
    });

    test('returns correct result for other x values', () => {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0.5;
      const y = 3;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).toBe(4);
    });

    test('returns correct result when y below extent', () => {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0;
      const y = -2;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).toBe(4);
    });

    test('returns correct result when y above extent', () => {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0;
      const y = 3;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).toBe(4);
    });

    test('returns correct result for other y values', () => {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 3;
      const y = 0.5;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).toBe(4);
    });

  });

  describe('createOrUpdateFromCoordinate', () => {

    test('works when no extent passed', () => {
      const coords = [0, 1];
      const expected = [0, 1, 0, 1];
      const got = _ol_extent_.createOrUpdateFromCoordinate(coords);
      expect(got).toEqual(expected);
    });

    test('updates a passed extent', () => {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [0, 1];
      const expected = [0, 1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinate(coords, extent);
      expect(extent).toEqual(expected);
    });

  });

  describe('createOrUpdateFromCoordinates', () => {

    test('works when single coordinate and no extent passed', () => {
      const coords = [[0, 1]];
      const expected = [0, 1, 0, 1];
      const got = _ol_extent_.createOrUpdateFromCoordinates(coords);
      expect(got).toEqual(expected);
    });

    test('changes the passed extent when single coordinate', () => {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [[0, 1]];
      const expected = [0, 1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinates(coords, extent);
      expect(extent).toEqual(expected);
    });

    test('works when multiple coordinates and no extent passed', () => {
      const coords = [[0, 1], [2, 3]];
      const expected = [0, 1, 2, 3];
      const got = _ol_extent_.createOrUpdateFromCoordinates(coords);
      expect(got).toEqual(expected);
    });

    test('changes the passed extent when multiple coordinates given', () => {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [[0, 1], [-2, -1]];
      const expected = [-2, -1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinates(coords, extent);
      expect(extent).toEqual(expected);
    });

  });

  describe('createOrUpdateFromRings', () => {

    test('works when single ring and no extent passed', () => {
      const ring = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const rings = [ring];
      const expected = [0, 0, 2, 2];
      const got = _ol_extent_.createOrUpdateFromRings(rings);
      expect(got).toEqual(expected);
    });

    test('changes the passed extent when single ring given', () => {
      const ring = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const rings = [ring];
      const extent = [1, 1, 4, 7];
      const expected = [0, 0, 2, 2];
      _ol_extent_.createOrUpdateFromRings(rings, extent);
      expect(extent).toEqual(expected);
    });

    test('works when multiple rings and no extent passed', () => {
      const ring1 = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const ring2 = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]];
      const rings = [ring1, ring2];
      const expected = [0, 0, 3, 3];
      const got = _ol_extent_.createOrUpdateFromRings(rings);
      expect(got).toEqual(expected);
    });

    test('changes the passed extent when multiple rings given', () => {
      const ring1 = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const ring2 = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]];
      const rings = [ring1, ring2];
      const extent = [1, 1, 4, 7];
      const expected = [0, 0, 3, 3];
      _ol_extent_.createOrUpdateFromRings(rings, extent);
      expect(extent).toEqual(expected);
    });

  });

  describe('forEachCorner', () => {

    let callbackFalse;
    let callbackTrue;
    beforeEach(() => {
      callbackFalse = sinon.spy(function() {
        return false;
      });
      callbackTrue = sinon.spy(function() {
        return true;
      });
    });

    test('calls the passed callback for each corner', () => {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackFalse);
      expect(callbackFalse.callCount).toBe(4);
    });

    test('calls the passed callback with each corner', () => {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackFalse);
      const firstCallFirstArg = callbackFalse.args[0][0];
      const secondCallFirstArg = callbackFalse.args[1][0];
      const thirdCallFirstArg = callbackFalse.args[2][0];
      const fourthCallFirstArg = callbackFalse.args[3][0];
      expect(firstCallFirstArg).toEqual([1, 2]);
      expect(secondCallFirstArg).toEqual([3, 2]);
      expect(thirdCallFirstArg).toEqual([3, 4]);
      expect(fourthCallFirstArg).toEqual([1, 4]);
    });

    test('calls a truthy callback only once', () => {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackTrue);
      expect(callbackTrue.callCount).toBe(1);
    });

    test('ensures that any corner can cancel the callback execution', () => {
      const extent = [1, 2, 3, 4];
      const bottomLeftSpy = sinon.spy(function(corner) {
        return (corner[0] === 1 && corner[1] === 2) ? true : false;
      });
      const bottomRightSpy = sinon.spy(function(corner) {
        return (corner[0] === 3 && corner[1] === 2) ? true : false;
      });
      const topRightSpy = sinon.spy(function(corner) {
        return (corner[0] === 3 && corner[1] === 4) ? true : false;
      });
      const topLeftSpy = sinon.spy(function(corner) {
        return (corner[0] === 1 && corner[1] === 4) ? true : false;
      });

      _ol_extent_.forEachCorner(extent, bottomLeftSpy);
      _ol_extent_.forEachCorner(extent, bottomRightSpy);
      _ol_extent_.forEachCorner(extent, topRightSpy);
      _ol_extent_.forEachCorner(extent, topLeftSpy);

      expect(bottomLeftSpy.callCount).toBe(1);
      expect(bottomRightSpy.callCount).toBe(2);
      expect(topRightSpy.callCount).toBe(3);
      expect(topLeftSpy.callCount).toBe(4);
    });

    test(
      'returns false eventually, if no invocation returned a truthy value',
      () => {
        const extent = [1, 2, 3, 4];
        const spy = sinon.spy(); // will return undefined for each corner
        const got = _ol_extent_.forEachCorner(extent, spy);
        expect(spy.callCount).toBe(4);
        expect(got).toBe(false);
      }
    );

  });

  describe('getArea', () => {
    test('returns zero for empty extents', () => {
      const emptyExtent = _ol_extent_.createEmpty();
      const areaEmpty = _ol_extent_.getArea(emptyExtent);
      expect(areaEmpty).toBe(0);

      const extentDeltaXZero = [45, 67, 45, 78];
      const areaDeltaXZero = _ol_extent_.getArea(extentDeltaXZero);
      expect(areaDeltaXZero).toBe(0);

      const extentDeltaYZero = [11, 67, 45, 67];
      const areaDeltaYZero = _ol_extent_.getArea(extentDeltaYZero);
      expect(areaDeltaYZero).toBe(0);
    });
    test('calculates correct area for other extents', () => {
      const extent = [0, 0, 10, 10];
      const area = _ol_extent_.getArea(extent);
      expect(area).toBe(100);
    });
  });

  describe('getIntersection()', () => {
    test('returns the intersection of two extents', () => {
      const world = [-180, -90, 180, 90];
      const north = [-180, 0, 180, 90];
      const farNorth = [-180, 45, 180, 90];
      const east = [0, -90, 180, 90];
      const farEast = [90, -90, 180, 90];
      const south = [-180, -90, 180, 0];
      const farSouth = [-180, -90, 180, -45];
      const west = [-180, -90, 0, 90];
      const farWest = [-180, -90, -90, 90];
      const none = _ol_extent_.createEmpty();
      expect(_ol_extent_.getIntersection(world, none)).toEqual(none);
      expect(_ol_extent_.getIntersection(world, north)).toEqual(north);
      expect(_ol_extent_.getIntersection(world, east)).toEqual(east);
      expect(_ol_extent_.getIntersection(world, south)).toEqual(south);
      expect(_ol_extent_.getIntersection(world, west)).toEqual(west);
      expect(_ol_extent_.getIntersection(farEast, farWest)).toEqual(none);
      expect(_ol_extent_.getIntersection(farNorth, farSouth)).toEqual(none);
      expect(_ol_extent_.getIntersection(north, west)).toEqual([-180, 0, 0, 90]);
      expect(_ol_extent_.getIntersection(east, south)).toEqual([0, -90, 180, 0]);
    });


    test('can take an destination extent', () => {
      const world = [-180, -90, 180, 90];
      const north = [-180, 0, 180, 90];
      const none = _ol_extent_.createEmpty();
      let tmpExtent = [-180, 45, 180, 90];
      expect(_ol_extent_.getIntersection(world, north, tmpExtent)).toEqual(north);
      expect(_ol_extent_.getIntersection(world, none, tmpExtent)).toEqual(none);

      tmpExtent = [-180, -90, 180, 90];
      expect(_ol_extent_.getIntersection(tmpExtent, north, tmpExtent)).toEqual(north);
    });

  });

  describe('containsCoordinate', () => {

    describe('positive', () => {
      test('returns true', () => {
        const extent = [1, 2, 3, 4];
        expect(_ol_extent_.containsCoordinate(extent, [1, 2])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [1, 3])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [1, 4])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [2, 2])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [2, 3])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [2, 4])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [3, 2])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [3, 3])).toBeTruthy();
        expect(_ol_extent_.containsCoordinate(extent, [3, 4])).toBeTruthy();
      });
    });

    describe('negative', () => {
      test('returns false', () => {
        const extent = [1, 2, 3, 4];
        expect(_ol_extent_.containsCoordinate(extent, [0, 1])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [0, 2])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [0, 3])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [0, 4])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [0, 5])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [1, 1])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [1, 5])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [2, 1])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [2, 5])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [3, 1])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [3, 5])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [4, 1])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [4, 2])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [4, 3])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [4, 4])).not.toBe();
        expect(_ol_extent_.containsCoordinate(extent, [4, 5])).not.toBe();
      });
    });
  });

  describe('coordinateRelationship()', () => {

    const extent = [-180, -90, 180, 90];
    const INTERSECTING = 1;
    const ABOVE = 2;
    const RIGHT = 4;
    const BELOW = 8;
    const LEFT = 16;

    test('returns intersecting for within', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 0]);
      expect(rel).toBe(INTERSECTING);
    });

    test('returns intersecting for touching top', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 90]);
      expect(rel).toBe(INTERSECTING);
    });

    test('returns intersecting for touching right', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [180, 0]);
      expect(rel).toBe(INTERSECTING);
    });

    test('returns intersecting for touching bottom', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, -90]);
      expect(rel).toBe(INTERSECTING);
    });

    test('returns intersecting for touching left', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [-180, 0]);
      expect(rel).toBe(INTERSECTING);
    });

    test('above for north', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 100]);
      expect(rel).toBe(ABOVE);
    });

    test('above and right for northeast', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, 100]);
      expect(rel & ABOVE).toBe(ABOVE);
      expect(rel & RIGHT).toBe(RIGHT);
    });

    test('right for east', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, 0]);
      expect(rel).toBe(RIGHT);
    });

    test('below and right for southeast', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, -100]);
      expect(rel & BELOW).toBe(BELOW);
      expect(rel & RIGHT).toBe(RIGHT);
    });

    test('below for south', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, -100]);
      expect(rel).toBe(BELOW);
    });

    test('below and left for southwest', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, -100]);
      expect(rel & BELOW).toBe(BELOW);
      expect(rel & LEFT).toBe(LEFT);
    });

    test('left for west', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, 0]);
      expect(rel).toBe(LEFT);
    });

    test('above and left for northwest', () => {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, 100]);
      expect(rel & ABOVE).toBe(ABOVE);
      expect(rel & LEFT).toBe(LEFT);
    });

  });

  describe('getCenter', () => {
    test('returns the expected center', () => {
      const extent = [1, 2, 3, 4];
      const center = _ol_extent_.getCenter(extent);
      expect(center[0]).toEqual(2);
      expect(center[1]).toEqual(3);
    });
    test('returns [NaN, NaN] for empty extents', () => {
      const extent = _ol_extent_.createEmpty();
      const center = _ol_extent_.getCenter(extent);
      expect('' + center[0]).toBe('NaN');
      expect('' + center[1]).toBe('NaN');
    });
  });

  describe('getCorner', () => {
    const extent = [1, 2, 3, 4];

    test('gets the bottom left', () => {
      const corner = 'bottom-left';
      expect(_ol_extent_.getCorner(extent, corner)).toEqual([1, 2]);
    });

    test('gets the bottom right', () => {
      const corner = 'bottom-right';
      expect(_ol_extent_.getCorner(extent, corner)).toEqual([3, 2]);
    });

    test('gets the top left', () => {
      const corner = 'top-left';
      expect(_ol_extent_.getCorner(extent, corner)).toEqual([1, 4]);
    });

    test('gets the top right', () => {
      const corner = 'top-right';
      expect(_ol_extent_.getCorner(extent, corner)).toEqual([3, 4]);
    });

    test('throws exception for unexpected corner', () => {
      expect(function() {
        _ol_extent_.getCorner(extent, 'foobar');
      }).toThrow();
    });

  });

  describe('getEnlargedArea', () => {
    test('returns enlarged area of two extents', () => {
      const extent1 = [-1, -1, 0, 0];
      const extent2 = [0, 0, 1, 1];
      const enlargedArea = _ol_extent_.getEnlargedArea(extent1, extent2);
      expect(enlargedArea).toBe(4);
    });
  });

  describe('getForViewAndSize', () => {

    test('works for a unit square', () => {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 1, 0, [1, 1]);
      expect(extent[0]).toBe(-0.5);
      expect(extent[2]).toBe(0.5);
      expect(extent[1]).toBe(-0.5);
      expect(extent[3]).toBe(0.5);
    });

    test('works for center', () => {
      const extent = _ol_extent_.getForViewAndSize(
        [5, 10], 1, 0, [1, 1]);
      expect(extent[0]).toBe(4.5);
      expect(extent[2]).toBe(5.5);
      expect(extent[1]).toBe(9.5);
      expect(extent[3]).toBe(10.5);
    });

    test('works for rotation', () => {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 1, Math.PI / 4, [1, 1]);
      expect(extent[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[2]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
      expect(extent[1]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[3]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
    });

    test('works for resolution', () => {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 2, 0, [1, 1]);
      expect(extent[0]).toBe(-1);
      expect(extent[2]).toBe(1);
      expect(extent[1]).toBe(-1);
      expect(extent[3]).toBe(1);
    });

    test('works for size', () => {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 1, 0, [10, 5]);
      expect(extent[0]).toBe(-5);
      expect(extent[2]).toBe(5);
      expect(extent[1]).toBe(-2.5);
      expect(extent[3]).toBe(2.5);
    });

  });

  describe('getSize', () => {
    test('returns the expected size', () => {
      const extent = [0, 1, 2, 4];
      const size = _ol_extent_.getSize(extent);
      expect(size).toEqual([2, 3]);
    });
  });

  describe('getIntersectionArea', () => {
    test('returns correct area when extents intersect', () => {
      const extent1 = [0, 0, 2, 2];
      const extent2 = [1, 1, 3, 3];
      const intersectionArea = _ol_extent_.getIntersectionArea(extent1, extent2);
      expect(intersectionArea).toBe(1);
    });
    test('returns 0 when extents do not intersect', () => {
      const extent1 = [0, 0, 1, 1];
      const extent2 = [2, 2, 3, 3];
      const intersectionArea = _ol_extent_.getIntersectionArea(extent1, extent2);
      expect(intersectionArea).toBe(0);
    });
  });

  describe('getMargin', () => {
    test('returns the correct margin (sum of width and height)', () => {
      const extent = [1, 2, 3, 4];
      expect(_ol_extent_.getMargin(extent)).toBe(4);
    });
  });

  describe('intersects', () => {

    test('returns the expected value', () => {
      const intersects = _ol_extent_.intersects;
      const extent = [50, 50, 100, 100];
      expect(intersects(extent, extent)).toBe(true);
      expect(intersects(extent, [20, 20, 80, 80])).toBe(true);
      expect(intersects(extent, [20, 50, 80, 100])).toBe(true);
      expect(intersects(extent, [20, 80, 80, 120])).toBe(true);
      expect(intersects(extent, [50, 20, 100, 80])).toBe(true);
      expect(intersects(extent, [50, 80, 100, 120])).toBe(true);
      expect(intersects(extent, [80, 20, 120, 80])).toBe(true);
      expect(intersects(extent, [80, 50, 120, 100])).toBe(true);
      expect(intersects(extent, [80, 80, 120, 120])).toBe(true);
      expect(intersects(extent, [20, 20, 120, 120])).toBe(true);
      expect(intersects(extent, [70, 70, 80, 80])).toBe(true);
      expect(intersects(extent, [10, 10, 30, 30])).toBe(false);
      expect(intersects(extent, [30, 10, 70, 30])).toBe(false);
      expect(intersects(extent, [50, 10, 100, 30])).toBe(false);
      expect(intersects(extent, [80, 10, 120, 30])).toBe(false);
      expect(intersects(extent, [120, 10, 140, 30])).toBe(false);
      expect(intersects(extent, [10, 30, 30, 70])).toBe(false);
      expect(intersects(extent, [120, 30, 140, 70])).toBe(false);
      expect(intersects(extent, [10, 50, 30, 100])).toBe(false);
      expect(intersects(extent, [120, 50, 140, 100])).toBe(false);
      expect(intersects(extent, [10, 80, 30, 120])).toBe(false);
      expect(intersects(extent, [120, 80, 140, 120])).toBe(false);
      expect(intersects(extent, [10, 120, 30, 140])).toBe(false);
      expect(intersects(extent, [30, 120, 70, 140])).toBe(false);
      expect(intersects(extent, [50, 120, 100, 140])).toBe(false);
      expect(intersects(extent, [80, 120, 120, 140])).toBe(false);
      expect(intersects(extent, [120, 120, 140, 140])).toBe(false);
    });
  });

  describe('scaleFromCenter', () => {
    test('scales the extent from its center', () => {
      const extent = [1, 1, 3, 3];
      _ol_extent_.scaleFromCenter(extent, 2);
      expect(extent[0]).toEqual(0);
      expect(extent[2]).toEqual(4);
      expect(extent[1]).toEqual(0);
      expect(extent[3]).toEqual(4);
    });
  });

  describe('intersectsSegment()', () => {

    const extent = [-180, -90, 180, 90];
    const north = [0, 100];
    const northeast = [190, 100];
    const east = [190, 0];
    const southeast = [190, -100];
    const south = [0, -100];
    const southwest = [-190, -100];
    const west = [-190, 0];
    const northwest = [-190, 100];
    const center = [0, 0];
    const top = [0, 90];
    const right = [180, 0];
    const bottom = [-90, 0];
    const left = [-180, 0];
    const inside = [10, 10];

    test('returns true if contained', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, center, inside);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses top', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, center, north);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses right', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, center, east);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses bottom', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, center, south);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses left', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, center, west);
      expect(intersects).toBe(true);
    });

    test('returns false if above', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, north);
      expect(intersects).toBe(false);
    });

    test('returns false if right', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, northeast, east);
      expect(intersects).toBe(false);
    });

    test('returns false if below', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, south, southwest);
      expect(intersects).toBe(false);
    });

    test('returns false if left', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, west, southwest);
      expect(intersects).toBe(false);
    });

    test('returns true if crosses top to bottom', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, north, south);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses bottom to top', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, south, north);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses left to right', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, west, east);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses right to left', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, east, west);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses northwest to east', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, east);
      expect(intersects).toBe(true);
    });

    test('returns true if crosses south to west', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, south, west);
      expect(intersects).toBe(true);
    });

    test('returns true if touches top', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, top);
      expect(intersects).toBe(true);
    });

    test('returns true if touches right', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, southeast, right);
      expect(intersects).toBe(true);
    });

    test('returns true if touches bottom', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, bottom, south);
      expect(intersects).toBe(true);
    });

    test('returns true if touches left', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, left, west);
      expect(intersects).toBe(true);
    });

    test('works for zero length inside', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, center, center);
      expect(intersects).toBe(true);
    });

    test('works for zero length outside', () => {
      const intersects = _ol_extent_.intersectsSegment(extent, north, north);
      expect(intersects).toBe(false);
    });

    test('works for left/right intersection spanning top to bottom', () => {
      const extent = [2, 1, 3, 4];
      const start = [0, 0];
      const end = [5, 5];
      expect(_ol_extent_.intersectsSegment(extent, start, end)).toBe(true);
      expect(_ol_extent_.intersectsSegment(extent, end, start)).toBe(true);
    });

    test('works for top/bottom intersection spanning left to right', () => {
      const extent = [1, 2, 4, 3];
      const start = [0, 0];
      const end = [5, 5];
      expect(_ol_extent_.intersectsSegment(extent, start, end)).toBe(true);
      expect(_ol_extent_.intersectsSegment(extent, end, start)).toBe(true);
    });

  });

  describe('#applyTransform()', () => {

    test('does transform', () => {
      const transformFn = getTransform('EPSG:4326', 'EPSG:3857');
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = _ol_extent_.applyTransform(
        sourceExtent, transformFn);
      expect(destinationExtent).not.toBe(undefined);
      expect(destinationExtent).not.toBe(null);
      // FIXME check values with third-party tool
      expect(destinationExtent[0])
        .to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent[2]).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent[1]).to.roughlyEqual(-3503549.843504376, 1e-8);
      expect(destinationExtent[3]).to.roughlyEqual(8399737.889818361, 1e-8);
    });

    test('takes arbitrary function', () => {
      const transformFn = function(input, output, opt_dimension) {
        const dimension = opt_dimension !== undefined ? opt_dimension : 2;
        if (output === undefined) {
          output = new Array(input.length);
        }
        const n = input.length;
        let i;
        for (i = 0; i < n; i += dimension) {
          output[i] = -input[i];
          output[i + 1] = -input[i + 1];
        }
        return output;
      };
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = _ol_extent_.applyTransform(
        sourceExtent, transformFn);
      expect(destinationExtent).not.toBe(undefined);
      expect(destinationExtent).not.toBe(null);
      expect(destinationExtent[0]).toBe(-45);
      expect(destinationExtent[2]).toBe(15);
      expect(destinationExtent[1]).toBe(-60);
      expect(destinationExtent[3]).toBe(30);
    });

  });

});
