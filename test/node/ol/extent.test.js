import {assert} from 'chai';
import proj4 from 'proj4';
import {spy as sinonSpy} from 'sinon';
import * as _ol_extent_ from '../../../src/ol/extent.js';
import {get, getTransform} from '../../../src/ol/proj.js';
import {register} from '../../../src/ol/proj/proj4.js';

describe('ol/extent.js', function () {
  describe('buffer', function () {
    it('buffers an extent by some value', function () {
      const extent = [-10, -20, 10, 20];
      assert.deepEqual(_ol_extent_.buffer(extent, 15), [-25, -35, 25, 35]);
    });
  });

  describe('clone', function () {
    it('creates a copy of an extent', function () {
      const extent = _ol_extent_.createOrUpdate(1, 2, 3, 4);
      const clone = _ol_extent_.clone(extent);
      assert.strictEqual(_ol_extent_.equals(extent, clone), true);

      _ol_extent_.extendCoordinate(extent, [10, 20]);
      assert.strictEqual(_ol_extent_.equals(extent, clone), false);
    });
  });

  describe('closestSquaredDistanceXY', function () {
    it('returns correct result when x left of extent', function () {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = -2;
      const y = 0;
      assert.strictEqual(_ol_extent_.closestSquaredDistanceXY(extent, x, y), 4);
    });

    it('returns correct result when x right of extent', function () {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 3;
      const y = 0;
      assert.strictEqual(_ol_extent_.closestSquaredDistanceXY(extent, x, y), 4);
    });

    it('returns correct result for other x values', function () {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0.5;
      const y = 3;
      assert.strictEqual(_ol_extent_.closestSquaredDistanceXY(extent, x, y), 4);
    });

    it('returns correct result when y below extent', function () {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0;
      const y = -2;
      assert.strictEqual(_ol_extent_.closestSquaredDistanceXY(extent, x, y), 4);
    });

    it('returns correct result when y above extent', function () {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0;
      const y = 3;
      assert.strictEqual(_ol_extent_.closestSquaredDistanceXY(extent, x, y), 4);
    });

    it('returns correct result for other y values', function () {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 3;
      const y = 0.5;
      assert.strictEqual(_ol_extent_.closestSquaredDistanceXY(extent, x, y), 4);
    });
  });

  describe('createOrUpdateFromCoordinate', function () {
    it('works when no extent passed', function () {
      const coords = [0, 1];
      const expected = [0, 1, 0, 1];
      const got = _ol_extent_.createOrUpdateFromCoordinate(coords);
      assert.deepEqual(got, expected);
    });

    it('updates a passed extent', function () {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [0, 1];
      const expected = [0, 1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinate(coords, extent);
      assert.deepEqual(extent, expected);
    });
  });

  describe('createOrUpdateFromCoordinates', function () {
    it('works when single coordinate and no extent passed', function () {
      const coords = [[0, 1]];
      const expected = [0, 1, 0, 1];
      const got = _ol_extent_.createOrUpdateFromCoordinates(coords);
      assert.deepEqual(got, expected);
    });

    it('changes the passed extent when single coordinate', function () {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [[0, 1]];
      const expected = [0, 1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinates(coords, extent);
      assert.deepEqual(extent, expected);
    });

    it('works when multiple coordinates and no extent passed', function () {
      const coords = [
        [0, 1],
        [2, 3],
      ];
      const expected = [0, 1, 2, 3];
      const got = _ol_extent_.createOrUpdateFromCoordinates(coords);
      assert.deepEqual(got, expected);
    });

    it('changes the passed extent when multiple coordinates given', function () {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [
        [0, 1],
        [-2, -1],
      ];
      const expected = [-2, -1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinates(coords, extent);
      assert.deepEqual(extent, expected);
    });
  });

  describe('createOrUpdateFromRings', function () {
    it('works when single ring and no extent passed', function () {
      const ring = [
        [0, 0],
        [0, 2],
        [2, 2],
        [2, 0],
        [0, 0],
      ];
      const rings = [ring];
      const expected = [0, 0, 2, 2];
      const got = _ol_extent_.createOrUpdateFromRings(rings);
      assert.deepEqual(got, expected);
    });

    it('changes the passed extent when single ring given', function () {
      const ring = [
        [0, 0],
        [0, 2],
        [2, 2],
        [2, 0],
        [0, 0],
      ];
      const rings = [ring];
      const extent = [1, 1, 4, 7];
      const expected = [0, 0, 2, 2];
      _ol_extent_.createOrUpdateFromRings(rings, extent);
      assert.deepEqual(extent, expected);
    });

    it('works when multiple rings and no extent passed', function () {
      const ring1 = [
        [0, 0],
        [0, 2],
        [2, 2],
        [2, 0],
        [0, 0],
      ];
      const ring2 = [
        [1, 1],
        [1, 3],
        [3, 3],
        [3, 1],
        [1, 1],
      ];
      const rings = [ring1, ring2];
      const expected = [0, 0, 3, 3];
      const got = _ol_extent_.createOrUpdateFromRings(rings);
      assert.deepEqual(got, expected);
    });

    it('changes the passed extent when multiple rings given', function () {
      const ring1 = [
        [0, 0],
        [0, 2],
        [2, 2],
        [2, 0],
        [0, 0],
      ];
      const ring2 = [
        [1, 1],
        [1, 3],
        [3, 3],
        [3, 1],
        [1, 1],
      ];
      const rings = [ring1, ring2];
      const extent = [1, 1, 4, 7];
      const expected = [0, 0, 3, 3];
      _ol_extent_.createOrUpdateFromRings(rings, extent);
      assert.deepEqual(extent, expected);
    });
  });

  describe('forEachCorner', function () {
    let callbackFalse;
    let callbackTrue;
    beforeEach(function () {
      callbackFalse = sinonSpy(function () {
        return false;
      });
      callbackTrue = sinonSpy(function () {
        return true;
      });
    });

    it('calls the passed callback for each corner', function () {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackFalse);
      assert.strictEqual(callbackFalse.callCount, 4);
    });

    it('calls the passed callback with each corner', function () {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackFalse);
      const firstCallFirstArg = callbackFalse.args[0][0];
      const secondCallFirstArg = callbackFalse.args[1][0];
      const thirdCallFirstArg = callbackFalse.args[2][0];
      const fourthCallFirstArg = callbackFalse.args[3][0];
      assert.deepEqual(firstCallFirstArg, [1, 2]);
      assert.deepEqual(secondCallFirstArg, [3, 2]);
      assert.deepEqual(thirdCallFirstArg, [3, 4]);
      assert.deepEqual(fourthCallFirstArg, [1, 4]);
    });

    it('calls a truthy callback only once', function () {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackTrue);
      assert.strictEqual(callbackTrue.callCount, 1);
    });

    it('ensures that any corner can cancel the callback execution', function () {
      const extent = [1, 2, 3, 4];
      const bottomLeftSpy = sinonSpy(function (corner) {
        return corner[0] === 1 && corner[1] === 2 ? true : false;
      });
      const bottomRightSpy = sinonSpy(function (corner) {
        return corner[0] === 3 && corner[1] === 2 ? true : false;
      });
      const topRightSpy = sinonSpy(function (corner) {
        return corner[0] === 3 && corner[1] === 4 ? true : false;
      });
      const topLeftSpy = sinonSpy(function (corner) {
        return corner[0] === 1 && corner[1] === 4 ? true : false;
      });

      _ol_extent_.forEachCorner(extent, bottomLeftSpy);
      _ol_extent_.forEachCorner(extent, bottomRightSpy);
      _ol_extent_.forEachCorner(extent, topRightSpy);
      _ol_extent_.forEachCorner(extent, topLeftSpy);

      assert.strictEqual(bottomLeftSpy.callCount, 1);
      assert.strictEqual(bottomRightSpy.callCount, 2);
      assert.strictEqual(topRightSpy.callCount, 3);
      assert.strictEqual(topLeftSpy.callCount, 4);
    });

    it('returns false eventually, if no invocation returned a truthy value', function () {
      const extent = [1, 2, 3, 4];
      const spy = sinonSpy(); // will return undefined for each corner
      const got = _ol_extent_.forEachCorner(extent, spy);
      assert.strictEqual(spy.callCount, 4);
      assert.strictEqual(got, false);
    });
  });

  describe('getArea', function () {
    it('returns zero for empty extents', function () {
      const emptyExtent = _ol_extent_.createEmpty();
      const areaEmpty = _ol_extent_.getArea(emptyExtent);
      assert.strictEqual(areaEmpty, 0);

      const extentDeltaXZero = [45, 67, 45, 78];
      const areaDeltaXZero = _ol_extent_.getArea(extentDeltaXZero);
      assert.strictEqual(areaDeltaXZero, 0);

      const extentDeltaYZero = [11, 67, 45, 67];
      const areaDeltaYZero = _ol_extent_.getArea(extentDeltaYZero);
      assert.strictEqual(areaDeltaYZero, 0);
    });
    it('calculates correct area for other extents', function () {
      const extent = [0, 0, 10, 10];
      const area = _ol_extent_.getArea(extent);
      assert.strictEqual(area, 100);
    });
  });

  describe('getIntersection()', function () {
    it('returns the intersection of two extents', function () {
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
      assert.deepEqual(_ol_extent_.getIntersection(world, none), none);
      assert.deepEqual(_ol_extent_.getIntersection(world, north), north);
      assert.deepEqual(_ol_extent_.getIntersection(world, east), east);
      assert.deepEqual(_ol_extent_.getIntersection(world, south), south);
      assert.deepEqual(_ol_extent_.getIntersection(world, west), west);
      assert.deepEqual(_ol_extent_.getIntersection(farEast, farWest), none);
      assert.deepEqual(_ol_extent_.getIntersection(farNorth, farSouth), none);
      assert.deepEqual(
        _ol_extent_.getIntersection(north, west),
        [-180, 0, 0, 90],
      );
      assert.deepEqual(
        _ol_extent_.getIntersection(east, south),
        [0, -90, 180, 0],
      );
    });

    it('can take an destination extent', function () {
      const world = [-180, -90, 180, 90];
      const north = [-180, 0, 180, 90];
      const none = _ol_extent_.createEmpty();
      let tmpExtent = [-180, 45, 180, 90];
      assert.deepEqual(
        _ol_extent_.getIntersection(world, north, tmpExtent),
        north,
      );
      assert.deepEqual(
        _ol_extent_.getIntersection(world, none, tmpExtent),
        none,
      );

      tmpExtent = [-180, -90, 180, 90];
      assert.deepEqual(
        _ol_extent_.getIntersection(tmpExtent, north, tmpExtent),
        north,
      );
    });
  });

  describe('containsCoordinate', function () {
    describe('positive', function () {
      it('returns true', function () {
        const extent = [1, 2, 3, 4];
        assert.isOk(_ol_extent_.containsCoordinate(extent, [1, 2]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [1, 3]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [1, 4]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [2, 2]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [2, 3]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [2, 4]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [3, 2]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [3, 3]));
        assert.isOk(_ol_extent_.containsCoordinate(extent, [3, 4]));
      });
    });

    describe('negative', function () {
      it('returns false', function () {
        const extent = [1, 2, 3, 4];
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [0, 1]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [0, 2]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [0, 3]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [0, 4]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [0, 5]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [1, 1]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [1, 5]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [2, 1]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [2, 5]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [3, 1]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [3, 5]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [4, 1]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [4, 2]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [4, 3]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [4, 4]));
        assert.isFalse(_ol_extent_.containsCoordinate(extent, [4, 5]));
      });
    });
  });

  describe('coordinateRelationship()', function () {
    const extent = [-180, -90, 180, 90];
    const INTERSECTING = 1;
    const ABOVE = 2;
    const RIGHT = 4;
    const BELOW = 8;
    const LEFT = 16;

    it('returns intersecting for within', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 0]);
      assert.strictEqual(rel, INTERSECTING);
    });

    it('returns intersecting for touching top', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 90]);
      assert.strictEqual(rel, INTERSECTING);
    });

    it('returns intersecting for touching right', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [180, 0]);
      assert.strictEqual(rel, INTERSECTING);
    });

    it('returns intersecting for touching bottom', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, -90]);
      assert.strictEqual(rel, INTERSECTING);
    });

    it('returns intersecting for touching left', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [-180, 0]);
      assert.strictEqual(rel, INTERSECTING);
    });

    it('above for north', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 100]);
      assert.strictEqual(rel, ABOVE);
    });

    it('above and right for northeast', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, 100]);
      assert.strictEqual(rel & ABOVE, ABOVE);
      assert.strictEqual(rel & RIGHT, RIGHT);
    });

    it('right for east', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, 0]);
      assert.strictEqual(rel, RIGHT);
    });

    it('below and right for southeast', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, -100]);
      assert.strictEqual(rel & BELOW, BELOW);
      assert.strictEqual(rel & RIGHT, RIGHT);
    });

    it('below for south', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, -100]);
      assert.strictEqual(rel, BELOW);
    });

    it('below and left for southwest', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, -100]);
      assert.strictEqual(rel & BELOW, BELOW);
      assert.strictEqual(rel & LEFT, LEFT);
    });

    it('left for west', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, 0]);
      assert.strictEqual(rel, LEFT);
    });

    it('above and left for northwest', function () {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, 100]);
      assert.strictEqual(rel & ABOVE, ABOVE);
      assert.strictEqual(rel & LEFT, LEFT);
    });
  });

  describe('getCenter', function () {
    it('returns the expected center', function () {
      const extent = [1, 2, 3, 4];
      const center = _ol_extent_.getCenter(extent);
      assert.deepEqual(center[0], 2);
      assert.deepEqual(center[1], 3);
    });
    it('returns [NaN, NaN] for empty extents', function () {
      const extent = _ol_extent_.createEmpty();
      const center = _ol_extent_.getCenter(extent);
      assert.strictEqual('' + center[0], 'NaN');
      assert.strictEqual('' + center[1], 'NaN');
    });
  });

  describe('getCorner', function () {
    const extent = [1, 2, 3, 4];

    it('gets the bottom left', function () {
      const corner = 'bottom-left';
      assert.deepEqual(_ol_extent_.getCorner(extent, corner), [1, 2]);
    });

    it('gets the bottom right', function () {
      const corner = 'bottom-right';
      assert.deepEqual(_ol_extent_.getCorner(extent, corner), [3, 2]);
    });

    it('gets the top left', function () {
      const corner = 'top-left';
      assert.deepEqual(_ol_extent_.getCorner(extent, corner), [1, 4]);
    });

    it('gets the top right', function () {
      const corner = 'top-right';
      assert.deepEqual(_ol_extent_.getCorner(extent, corner), [3, 4]);
    });

    it('throws exception for unexpected corner', function () {
      assert.throws(function () {
        _ol_extent_.getCorner(extent, 'foobar');
      });
    });
  });

  describe('getEnlargedArea', function () {
    it('returns enlarged area of two extents', function () {
      const extent1 = [-1, -1, 0, 0];
      const extent2 = [0, 0, 1, 1];
      const enlargedArea = _ol_extent_.getEnlargedArea(extent1, extent2);
      assert.strictEqual(enlargedArea, 4);
    });
  });

  describe('getForViewAndSize', function () {
    it('works for a unit square', function () {
      const extent = _ol_extent_.getForViewAndSize([0, 0], 1, 0, [1, 1]);
      assert.strictEqual(extent[0], -0.5);
      assert.strictEqual(extent[2], 0.5);
      assert.strictEqual(extent[1], -0.5);
      assert.strictEqual(extent[3], 0.5);
    });

    it('works for center', function () {
      const extent = _ol_extent_.getForViewAndSize([5, 10], 1, 0, [1, 1]);
      assert.strictEqual(extent[0], 4.5);
      assert.strictEqual(extent[2], 5.5);
      assert.strictEqual(extent[1], 9.5);
      assert.strictEqual(extent[3], 10.5);
    });

    it('works for rotation', function () {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0],
        1,
        Math.PI / 4,
        [1, 1],
      );
      assert.approximately(extent[0], -Math.sqrt(0.5), 1e-9);
      assert.approximately(extent[2], Math.sqrt(0.5), 1e-9);
      assert.approximately(extent[1], -Math.sqrt(0.5), 1e-9);
      assert.approximately(extent[3], Math.sqrt(0.5), 1e-9);
    });

    it('works for resolution', function () {
      const extent = _ol_extent_.getForViewAndSize([0, 0], 2, 0, [1, 1]);
      assert.strictEqual(extent[0], -1);
      assert.strictEqual(extent[2], 1);
      assert.strictEqual(extent[1], -1);
      assert.strictEqual(extent[3], 1);
    });

    it('works for size', function () {
      const extent = _ol_extent_.getForViewAndSize([0, 0], 1, 0, [10, 5]);
      assert.strictEqual(extent[0], -5);
      assert.strictEqual(extent[2], 5);
      assert.strictEqual(extent[1], -2.5);
      assert.strictEqual(extent[3], 2.5);
    });
  });

  describe('getSize', function () {
    it('returns the expected size', function () {
      const extent = [0, 1, 2, 4];
      const size = _ol_extent_.getSize(extent);
      assert.deepEqual(size, [2, 3]);
    });
  });

  describe('getIntersectionArea', function () {
    it('returns correct area when extents intersect', function () {
      const extent1 = [0, 0, 2, 2];
      const extent2 = [1, 1, 3, 3];
      const intersectionArea = _ol_extent_.getIntersectionArea(
        extent1,
        extent2,
      );
      assert.strictEqual(intersectionArea, 1);
    });
    it('returns 0 when extents do not intersect', function () {
      const extent1 = [0, 0, 1, 1];
      const extent2 = [2, 2, 3, 3];
      const intersectionArea = _ol_extent_.getIntersectionArea(
        extent1,
        extent2,
      );
      assert.strictEqual(intersectionArea, 0);
    });
  });

  describe('getMargin', function () {
    it('returns the correct margin (sum of width and height)', function () {
      const extent = [1, 2, 3, 4];
      assert.strictEqual(_ol_extent_.getMargin(extent), 4);
    });
  });

  describe('intersects', function () {
    it('returns the expected value', function () {
      const intersects = _ol_extent_.intersects;
      const extent = [50, 50, 100, 100];
      assert.strictEqual(intersects(extent, extent), true);
      assert.strictEqual(intersects(extent, [20, 20, 80, 80]), true);
      assert.strictEqual(intersects(extent, [20, 50, 80, 100]), true);
      assert.strictEqual(intersects(extent, [20, 80, 80, 120]), true);
      assert.strictEqual(intersects(extent, [50, 20, 100, 80]), true);
      assert.strictEqual(intersects(extent, [50, 80, 100, 120]), true);
      assert.strictEqual(intersects(extent, [80, 20, 120, 80]), true);
      assert.strictEqual(intersects(extent, [80, 50, 120, 100]), true);
      assert.strictEqual(intersects(extent, [80, 80, 120, 120]), true);
      assert.strictEqual(intersects(extent, [20, 20, 120, 120]), true);
      assert.strictEqual(intersects(extent, [70, 70, 80, 80]), true);
      assert.strictEqual(intersects(extent, [10, 10, 30, 30]), false);
      assert.strictEqual(intersects(extent, [30, 10, 70, 30]), false);
      assert.strictEqual(intersects(extent, [50, 10, 100, 30]), false);
      assert.strictEqual(intersects(extent, [80, 10, 120, 30]), false);
      assert.strictEqual(intersects(extent, [120, 10, 140, 30]), false);
      assert.strictEqual(intersects(extent, [10, 30, 30, 70]), false);
      assert.strictEqual(intersects(extent, [120, 30, 140, 70]), false);
      assert.strictEqual(intersects(extent, [10, 50, 30, 100]), false);
      assert.strictEqual(intersects(extent, [120, 50, 140, 100]), false);
      assert.strictEqual(intersects(extent, [10, 80, 30, 120]), false);
      assert.strictEqual(intersects(extent, [120, 80, 140, 120]), false);
      assert.strictEqual(intersects(extent, [10, 120, 30, 140]), false);
      assert.strictEqual(intersects(extent, [30, 120, 70, 140]), false);
      assert.strictEqual(intersects(extent, [50, 120, 100, 140]), false);
      assert.strictEqual(intersects(extent, [80, 120, 120, 140]), false);
      assert.strictEqual(intersects(extent, [120, 120, 140, 140]), false);
    });
  });

  describe('scaleFromCenter', function () {
    it('scales the extent from its center', function () {
      const extent = [1, 1, 3, 3];
      _ol_extent_.scaleFromCenter(extent, 2);
      assert.deepEqual(extent[0], 0);
      assert.deepEqual(extent[2], 4);
      assert.deepEqual(extent[1], 0);
      assert.deepEqual(extent[3], 4);
    });
  });

  describe('intersectsSegment()', function () {
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

    it('returns true if contained', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, center, inside);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses top', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, center, north);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses right', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, center, east);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses bottom', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, center, south);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses left', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, center, west);
      assert.strictEqual(intersects, true);
    });

    it('returns false if above', function () {
      const intersects = _ol_extent_.intersectsSegment(
        extent,
        northwest,
        north,
      );
      assert.strictEqual(intersects, false);
    });

    it('returns false if right', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, northeast, east);
      assert.strictEqual(intersects, false);
    });

    it('returns false if below', function () {
      const intersects = _ol_extent_.intersectsSegment(
        extent,
        south,
        southwest,
      );
      assert.strictEqual(intersects, false);
    });

    it('returns false if left', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, west, southwest);
      assert.strictEqual(intersects, false);
    });

    it('returns true if crosses top to bottom', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, north, south);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses bottom to top', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, south, north);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses left to right', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, west, east);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses right to left', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, east, west);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses northwest to east', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, east);
      assert.strictEqual(intersects, true);
    });

    it('returns true if crosses south to west', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, south, west);
      assert.strictEqual(intersects, true);
    });

    it('returns true if touches top', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, top);
      assert.strictEqual(intersects, true);
    });

    it('returns true if touches right', function () {
      const intersects = _ol_extent_.intersectsSegment(
        extent,
        southeast,
        right,
      );
      assert.strictEqual(intersects, true);
    });

    it('returns true if touches bottom', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, bottom, south);
      assert.strictEqual(intersects, true);
    });

    it('returns true if touches left', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, left, west);
      assert.strictEqual(intersects, true);
    });

    it('works for zero length inside', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, center, center);
      assert.strictEqual(intersects, true);
    });

    it('works for zero length outside', function () {
      const intersects = _ol_extent_.intersectsSegment(extent, north, north);
      assert.strictEqual(intersects, false);
    });

    it('works for left/right intersection spanning top to bottom', function () {
      const extent = [2, 1, 3, 4];
      const start = [0, 0];
      const end = [5, 5];
      assert.strictEqual(
        _ol_extent_.intersectsSegment(extent, start, end),
        true,
      );
      assert.strictEqual(
        _ol_extent_.intersectsSegment(extent, end, start),
        true,
      );
    });

    it('works for top/bottom intersection spanning left to right', function () {
      const extent = [1, 2, 4, 3];
      const start = [0, 0];
      const end = [5, 5];
      assert.strictEqual(
        _ol_extent_.intersectsSegment(extent, start, end),
        true,
      );
      assert.strictEqual(
        _ol_extent_.intersectsSegment(extent, end, start),
        true,
      );
    });
  });

  describe('#applyTransform()', function () {
    it('returns empty for empty extents', function () {
      const transformFn = getTransform('EPSG:4326', 'EPSG:3857');
      const emptyExtent = _ol_extent_.createEmpty();
      const destEmpty = _ol_extent_.applyTransform(emptyExtent, transformFn);
      assert.deepEqual(destEmpty, emptyExtent);

      const extentDeltaXNeg = [45, 67, 44, 78];
      const destDeltaXNeg = _ol_extent_.applyTransform(
        extentDeltaXNeg,
        transformFn,
      );
      assert.deepEqual(destDeltaXNeg, emptyExtent);

      const extentDeltaYNeg = [11, 67, 44, 66];
      const destDeltaYNeg = _ol_extent_.applyTransform(
        extentDeltaYNeg,
        transformFn,
      );
      assert.deepEqual(destDeltaYNeg, emptyExtent);
    });

    it('does transform', function () {
      const transformFn = getTransform('EPSG:4326', 'EPSG:3857');
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = _ol_extent_.applyTransform(
        sourceExtent,
        transformFn,
      );
      assert.notEqual(destinationExtent, undefined);
      assert.notEqual(destinationExtent, null);
      assert.approximately(destinationExtent[0], -1669792.3618991037, 1e-9);
      assert.approximately(destinationExtent[2], 5009377.085697311, 1e-9);
      assert.approximately(destinationExtent[1], -3503549.843504376, 1e-8);
      assert.approximately(destinationExtent[3], 8399737.889818361, 1e-8);
    });

    it('does not treat a single point as empty', function () {
      const transformFn = getTransform('EPSG:4326', 'EPSG:3857');
      const sourceExtent = _ol_extent_.boundingExtent([[45, 60]]);
      const destinationExtent = _ol_extent_.applyTransform(
        sourceExtent,
        transformFn,
      );
      assert.notEqual(destinationExtent, undefined);
      assert.notEqual(destinationExtent, null);
      assert.approximately(destinationExtent[0], 5009377.085697311, 1e-9);
      assert.deepEqual(destinationExtent[2], destinationExtent[0]);
      assert.approximately(destinationExtent[1], 8399737.889818361, 1e-8);
      assert.deepEqual(destinationExtent[3], destinationExtent[1]);
    });

    it('takes arbitrary function', function () {
      const transformFn = function (input, output, opt_dimension) {
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
        sourceExtent,
        transformFn,
      );
      assert.notEqual(destinationExtent, undefined);
      assert.notEqual(destinationExtent, null);
      assert.strictEqual(destinationExtent[0], -45);
      assert.strictEqual(destinationExtent[2], 15);
      assert.strictEqual(destinationExtent[1], -60);
      assert.strictEqual(destinationExtent[3], 30);
    });

    it('can use the stops option', function () {
      proj4.defs(
        'EPSG:32632',
        '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs',
      );
      register(proj4);
      const transformFn = getTransform('EPSG:4326', 'EPSG:32632');
      const sourceExtentN = [6, 0, 12, 84];
      const destinationExtentN = _ol_extent_.applyTransform(
        sourceExtentN,
        transformFn,
      );
      assert.notEqual(destinationExtentN, undefined);
      assert.notEqual(destinationExtentN, null);
      assert.approximately(destinationExtentN[0], 166021.44308053964, 1e-8);
      assert.approximately(destinationExtentN[2], 833978.5569194605, 1e-8);
      assert.approximately(destinationExtentN[1], 0, 1e-8);
      assert.approximately(destinationExtentN[3], 9329005.182447437, 1e-8);
      const sourceExtentNS = [6, -84, 12, 84];
      const destinationExtentNS = _ol_extent_.applyTransform(
        sourceExtentNS,
        transformFn,
      );
      assert.notEqual(destinationExtentNS, undefined);
      assert.notEqual(destinationExtentNS, null);
      assert.approximately(destinationExtentNS[0], 465005.34493886377, 1e-8);
      assert.approximately(destinationExtentNS[2], 534994.6550611362, 1e-8);
      assert.approximately(
        destinationExtentNS[1],
        -destinationExtentN[3],
        1e-8,
      );
      assert.approximately(destinationExtentNS[3], destinationExtentN[3], 1e-8);
      const destinationExtentNS2 = _ol_extent_.applyTransform(
        sourceExtentNS,
        transformFn,
        undefined,
        2,
      );
      assert.notEqual(destinationExtentNS2, undefined);
      assert.notEqual(destinationExtentNS2, null);
      assert.approximately(
        destinationExtentNS2[0],
        destinationExtentN[0],
        1e-8,
      );
      assert.approximately(
        destinationExtentNS2[2],
        destinationExtentN[2],
        1e-8,
      );
      assert.approximately(
        destinationExtentNS2[1],
        -destinationExtentN[3],
        1e-8,
      );
      assert.approximately(
        destinationExtentNS2[3],
        destinationExtentN[3],
        1e-8,
      );
    });
  });

  describe('wrapX()', function () {
    const projection = get('EPSG:4326');

    it('leaves real world extent untouched', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([16, 48, 18, 49], projection),
        [16, 48, 18, 49],
      );
    });

    it('moves left world extent to real world', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([-344, 48, -342, 49], projection),
        [16, 48, 18, 49],
      );
    });

    it('moves right world extent to real world', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([376, 48, 378, 49], projection),
        [16, 48, 18, 49],
      );
    });

    it('moves far off left extent to real world', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([-1064, 48, -1062, 49], projection),
        [16, 48, 18, 49],
      );
    });

    it('moves far off right extent to real world', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([1096, 48, 1098, 49], projection),
        [16, 48, 18, 49],
      );
    });

    it('leaves -180 crossing extent with real world center untouched', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([-184, 48, 16, 49], projection),
        [-184, 48, 16, 49],
      );
    });

    it('moves +180 crossing extent with off-world center to the real world', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([300, 48, 376, 49], projection),
        [-60, 48, 16, 49],
      );
    });

    it('produces the same real world extent for shifted extents with center at +/-180', function () {
      assert.deepEqual(
        _ol_extent_.wrapX([360, -90, 720, 90], projection),
        [-360, -90, 0, 90],
      );
      assert.deepEqual(
        _ol_extent_.wrapX([0, -90, 360, 90], projection),
        [-360, -90, 0, 90],
      );
      assert.deepEqual(
        _ol_extent_.wrapX([-360, -90, 0, 90], projection),
        [-360, -90, 0, 90],
      );
    });
  });

  describe('approximatelyEquals', function () {
    it('returns true when within tolerance', function () {
      assert.strictEqual(
        _ol_extent_.approximatelyEquals(
          [16, 48, 17, 49],
          [16.09, 48, 17, 49],
          0.1,
        ),
        true,
      );
    });
    it('returns false when not within tolerance', function () {
      assert.strictEqual(
        _ol_extent_.approximatelyEquals(
          [16, 48, 17, 49],
          [16.11, 48, 17, 49],
          0.1,
        ),
        false,
      );
    });
  });

  describe('wrapAndSliceX', function () {
    const projection = get('EPSG:4326');

    it('leaves real world extent untouched', function () {
      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([16, 48, 18, 49], projection),
        [[16, 48, 18, 49]],
      );
    });

    it('slices +180 crossing extents', function () {
      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([164, 48, 198, 49], projection),
        [
          [164, 48, 180, 49],
          [-180, 48, -162, 49],
        ],
      );

      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([178, 48, 198, 49], projection),
        [
          [178, 48, 180, 49],
          [-180, 48, -162, 49],
        ],
      );
    });

    it('slices -180 crossing extents', function () {
      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([-198, 48, -160, 49], projection),
        [
          [162, 48, 180, 49],
          [-180, 48, -160, 49],
        ],
      );

      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([-202, 48, -160, 49], projection),
        [
          [158, 48, 180, 49],
          [-180, 48, -160, 49],
        ],
      );
    });

    it('fits infinite extents to the projection extent', function () {
      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([-Infinity, 48, -160, 49], projection),
        [[-180, 48, 180, 49]],
      );

      assert.deepEqual(
        _ol_extent_.wrapAndSliceX([-198, 48, Infinity, 49], projection),
        [[-180, 48, 180, 49]],
      );
    });
  });
});

describe('getDifference', function () {
  it('returns a copy of extent1 when the extents do not intersect', function () {
    const extent1 = [0, 0, 10, 10];
    const extent2 = [20, 20, 30, 30];
    const result = _ol_extent_.getDifference(extent1, extent2);
    assert.strictEqual(result.length, 1);
    assert.deepEqual(result[0], extent1);
    assert.notEqual(result[0], extent1);
  });

  it('returns an empty array when extent2 contains extent1', function () {
    const extent1 = [5, 5, 15, 15];
    const extent2 = [0, 0, 20, 20];
    const result = _ol_extent_.getDifference(extent1, extent2);
    assert.deepEqual(result, []);
  });

  it('returns one strip when extent2 overlaps a single side', function () {
    const extent1 = [0, 0, 10, 10];
    const extent2 = [5, 0, 20, 10];
    const result = _ol_extent_.getDifference(extent1, extent2);
    assert.strictEqual(result.length, 1);
    assert.deepEqual(result[0], [0, 0, 5, 10]);
  });

  it('returns two strips when extent2 overlaps a corner', function () {
    const extent1 = [0, 0, 10, 10];
    const extent2 = [5, 5, 20, 20];
    const result = _ol_extent_.getDifference(extent1, extent2);
    assert.strictEqual(result.length, 2);
    assert.deepEqual(result[0], [0, 0, 5, 10]);
    assert.deepEqual(result[1], [5, 0, 10, 5]);
  });

  it('returns four strips when extent2 lies inside extent1', function () {
    const extent1 = [0, 0, 10, 10];
    const extent2 = [3, 3, 7, 7];
    const result = _ol_extent_.getDifference(extent1, extent2);
    assert.strictEqual(result.length, 4);
    assert.deepEqual(result[0], [0, 0, 3, 10]);
    assert.deepEqual(result[1], [7, 0, 10, 10]);
    assert.deepEqual(result[2], [3, 0, 7, 3]);
    assert.deepEqual(result[3], [3, 7, 7, 10]);
  });

  it('returns extent1 unchanged when extent2 only touches an edge', function () {
    const extent1 = [0, 0, 10, 10];
    const extent2 = [10, 0, 20, 10];
    const result = _ol_extent_.getDifference(extent1, extent2);
    assert.strictEqual(result.length, 1);
    assert.deepEqual(result[0], [0, 0, 10, 10]);
  });
});
