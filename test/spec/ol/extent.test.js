import * as _ol_extent_ from '../../../src/ol/extent.js';
import {getTransform} from '../../../src/ol/proj.js';


describe('ol.extent', function() {

  describe('buffer', function() {

    it('buffers an extent by some value', function() {
      const extent = [-10, -20, 10, 20];
      expect(_ol_extent_.buffer(extent, 15)).to.eql([-25, -35, 25, 35]);
    });

  });

  describe('clone', function() {

    it('creates a copy of an extent', function() {
      const extent = _ol_extent_.createOrUpdate(1, 2, 3, 4);
      const clone = _ol_extent_.clone(extent);
      expect(_ol_extent_.equals(extent, clone)).to.be(true);

      _ol_extent_.extendCoordinate(extent, [10, 20]);
      expect(_ol_extent_.equals(extent, clone)).to.be(false);
    });

  });

  describe('closestSquaredDistanceXY', function() {

    it('returns correct result when x left of extent', function() {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = -2;
      const y = 0;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result when x right of extent', function() {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 3;
      const y = 0;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result for other x values', function() {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0.5;
      const y = 3;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result when y below extent', function() {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0;
      const y = -2;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result when y above extent', function() {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 0;
      const y = 3;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result for other y values', function() {
      const extent = _ol_extent_.createOrUpdate(0, 0, 1, 1);
      const x = 3;
      const y = 0.5;
      expect(_ol_extent_.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

  });

  describe('createOrUpdateFromCoordinate', function() {

    it('works when no extent passed', function() {
      const coords = [0, 1];
      const expected = [0, 1, 0, 1];
      const got = _ol_extent_.createOrUpdateFromCoordinate(coords);
      expect(got).to.eql(expected);
    });

    it('updates a passed extent', function() {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [0, 1];
      const expected = [0, 1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinate(coords, extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('createOrUpdateFromCoordinates', function() {

    it('works when single coordinate and no extent passed', function() {
      const coords = [[0, 1]];
      const expected = [0, 1, 0, 1];
      const got = _ol_extent_.createOrUpdateFromCoordinates(coords);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when single coordinate', function() {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [[0, 1]];
      const expected = [0, 1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinates(coords, extent);
      expect(extent).to.eql(expected);
    });

    it('works when multiple coordinates and no extent passed', function() {
      const coords = [[0, 1], [2, 3]];
      const expected = [0, 1, 2, 3];
      const got = _ol_extent_.createOrUpdateFromCoordinates(coords);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when multiple coordinates given', function() {
      const extent = _ol_extent_.createOrUpdate(-4, -7, -3, -6);
      const coords = [[0, 1], [-2, -1]];
      const expected = [-2, -1, 0, 1];
      _ol_extent_.createOrUpdateFromCoordinates(coords, extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('createOrUpdateFromRings', function() {

    it('works when single ring and no extent passed', function() {
      const ring = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const rings = [ring];
      const expected = [0, 0, 2, 2];
      const got = _ol_extent_.createOrUpdateFromRings(rings);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when single ring given', function() {
      const ring = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const rings = [ring];
      const extent = [1, 1, 4, 7];
      const expected = [0, 0, 2, 2];
      _ol_extent_.createOrUpdateFromRings(rings, extent);
      expect(extent).to.eql(expected);
    });

    it('works when multiple rings and no extent passed', function() {
      const ring1 = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const ring2 = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]];
      const rings = [ring1, ring2];
      const expected = [0, 0, 3, 3];
      const got = _ol_extent_.createOrUpdateFromRings(rings);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when multiple rings given', function() {
      const ring1 = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      const ring2 = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]];
      const rings = [ring1, ring2];
      const extent = [1, 1, 4, 7];
      const expected = [0, 0, 3, 3];
      _ol_extent_.createOrUpdateFromRings(rings, extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('forEachCorner', function() {

    let callbackFalse;
    let callbackTrue;
    beforeEach(function() {
      callbackFalse = sinon.spy(function() {
        return false;
      });
      callbackTrue = sinon.spy(function() {
        return true;
      });
    });

    it('calls the passed callback for each corner', function() {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackFalse);
      expect(callbackFalse.callCount).to.be(4);
    });

    it('calls the passed callback with each corner', function() {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackFalse);
      const firstCallFirstArg = callbackFalse.args[0][0];
      const secondCallFirstArg = callbackFalse.args[1][0];
      const thirdCallFirstArg = callbackFalse.args[2][0];
      const fourthCallFirstArg = callbackFalse.args[3][0];
      expect(firstCallFirstArg).to.eql([1, 2]); // bl
      expect(secondCallFirstArg).to.eql([3, 2]); // br
      expect(thirdCallFirstArg).to.eql([3, 4]); // tr
      expect(fourthCallFirstArg).to.eql([1, 4]); // tl
    });

    it('calls a truthy callback only once', function() {
      const extent = [1, 2, 3, 4];
      _ol_extent_.forEachCorner(extent, callbackTrue);
      expect(callbackTrue.callCount).to.be(1);
    });

    it('ensures that any corner can cancel the callback execution', function() {
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

      expect(bottomLeftSpy.callCount).to.be(1);
      expect(bottomRightSpy.callCount).to.be(2);
      expect(topRightSpy.callCount).to.be(3);
      expect(topLeftSpy.callCount).to.be(4);
    });

    it('returns false eventually, if no invocation returned a truthy value',
      function() {
        const extent = [1, 2, 3, 4];
        const spy = sinon.spy(); // will return undefined for each corner
        const got = _ol_extent_.forEachCorner(extent, spy);
        expect(spy.callCount).to.be(4);
        expect(got).to.be(false);
      }
    );

  });

  describe('getArea', function() {
    it('returns zero for empty extents', function() {
      const emptyExtent = _ol_extent_.createEmpty();
      const areaEmpty = _ol_extent_.getArea(emptyExtent);
      expect(areaEmpty).to.be(0);

      const extentDeltaXZero = [45, 67, 45, 78];
      const areaDeltaXZero = _ol_extent_.getArea(extentDeltaXZero);
      expect(areaDeltaXZero).to.be(0);

      const extentDeltaYZero = [11, 67, 45, 67];
      const areaDeltaYZero = _ol_extent_.getArea(extentDeltaYZero);
      expect(areaDeltaYZero).to.be(0);
    });
    it('calculates correct area for other extents', function() {
      const extent = [0, 0, 10, 10];
      const area = _ol_extent_.getArea(extent);
      expect(area).to.be(100);
    });
  });

  describe('getIntersection()', function() {
    it('returns the intersection of two extents', function() {
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
      expect(_ol_extent_.getIntersection(world, none)).to.eql(none);
      expect(_ol_extent_.getIntersection(world, north)).to.eql(north);
      expect(_ol_extent_.getIntersection(world, east)).to.eql(east);
      expect(_ol_extent_.getIntersection(world, south)).to.eql(south);
      expect(_ol_extent_.getIntersection(world, west)).to.eql(west);
      expect(_ol_extent_.getIntersection(farEast, farWest)).to.eql(none);
      expect(_ol_extent_.getIntersection(farNorth, farSouth)).to.eql(none);
      expect(_ol_extent_.getIntersection(north, west)).to.eql([-180, 0, 0, 90]);
      expect(_ol_extent_.getIntersection(east, south)).to.eql([0, -90, 180, 0]);
    });


    it('can take an destination extent', function() {
      const world = [-180, -90, 180, 90];
      const north = [-180, 0, 180, 90];
      const none = _ol_extent_.createEmpty();
      let tmpExtent = [-180, 45, 180, 90];
      expect(_ol_extent_.getIntersection(world, north, tmpExtent)).to.eql(north);
      expect(_ol_extent_.getIntersection(world, none, tmpExtent)).to.eql(none);

      tmpExtent = [-180, -90, 180, 90];
      expect(_ol_extent_.getIntersection(tmpExtent, north, tmpExtent)).to.eql(north);
    });

  });

  describe('containsCoordinate', function() {

    describe('positive', function() {
      it('returns true', function() {
        const extent = [1, 2, 3, 4];
        expect(_ol_extent_.containsCoordinate(extent, [1, 2])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [1, 3])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [1, 4])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [2, 2])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [2, 3])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [2, 4])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [3, 2])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [3, 3])).to.be.ok();
        expect(_ol_extent_.containsCoordinate(extent, [3, 4])).to.be.ok();
      });
    });

    describe('negative', function() {
      it('returns false', function() {
        const extent = [1, 2, 3, 4];
        expect(_ol_extent_.containsCoordinate(extent, [0, 1])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [0, 2])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [0, 3])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [0, 4])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [0, 5])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [1, 1])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [1, 5])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [2, 1])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [2, 5])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [3, 1])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [3, 5])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [4, 1])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [4, 2])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [4, 3])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [4, 4])).to.not.be();
        expect(_ol_extent_.containsCoordinate(extent, [4, 5])).to.not.be();
      });
    });
  });

  describe('coordinateRelationship()', function() {

    const extent = [-180, -90, 180, 90];
    const INTERSECTING = 1;
    const ABOVE = 2;
    const RIGHT = 4;
    const BELOW = 8;
    const LEFT = 16;

    it('returns intersecting for within', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 0]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching top', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 90]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching right', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [180, 0]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching bottom', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, -90]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching left', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [-180, 0]);
      expect(rel).to.be(INTERSECTING);
    });

    it('above for north', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, 100]);
      expect(rel).to.be(ABOVE);
    });

    it('above and right for northeast', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, 100]);
      expect(rel & ABOVE).to.be(ABOVE);
      expect(rel & RIGHT).to.be(RIGHT);
    });

    it('right for east', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, 0]);
      expect(rel).to.be(RIGHT);
    });

    it('below and right for southeast', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [190, -100]);
      expect(rel & BELOW).to.be(BELOW);
      expect(rel & RIGHT).to.be(RIGHT);
    });

    it('below for south', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [0, -100]);
      expect(rel).to.be(BELOW);
    });

    it('below and left for southwest', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, -100]);
      expect(rel & BELOW).to.be(BELOW);
      expect(rel & LEFT).to.be(LEFT);
    });

    it('left for west', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, 0]);
      expect(rel).to.be(LEFT);
    });

    it('above and left for northwest', function() {
      const rel = _ol_extent_.coordinateRelationship(extent, [-190, 100]);
      expect(rel & ABOVE).to.be(ABOVE);
      expect(rel & LEFT).to.be(LEFT);
    });

  });

  describe('getCenter', function() {
    it('returns the expected center', function() {
      const extent = [1, 2, 3, 4];
      const center = _ol_extent_.getCenter(extent);
      expect(center[0]).to.eql(2);
      expect(center[1]).to.eql(3);
    });
    it('returns [NaN, NaN] for empty extents', function() {
      const extent = _ol_extent_.createEmpty();
      const center = _ol_extent_.getCenter(extent);
      expect('' + center[0]).to.be('NaN');
      expect('' + center[1]).to.be('NaN');
    });
  });

  describe('getCorner', function() {
    const extent = [1, 2, 3, 4];

    it('gets the bottom left', function() {
      const corner = 'bottom-left';
      expect(_ol_extent_.getCorner(extent, corner)).to.eql([1, 2]);
    });

    it('gets the bottom right', function() {
      const corner = 'bottom-right';
      expect(_ol_extent_.getCorner(extent, corner)).to.eql([3, 2]);
    });

    it('gets the top left', function() {
      const corner = 'top-left';
      expect(_ol_extent_.getCorner(extent, corner)).to.eql([1, 4]);
    });

    it('gets the top right', function() {
      const corner = 'top-right';
      expect(_ol_extent_.getCorner(extent, corner)).to.eql([3, 4]);
    });

    it('throws exception for unexpected corner', function() {
      expect(function() {
        _ol_extent_.getCorner(extent, 'foobar');
      }).to.throwException();
    });

  });

  describe('getEnlargedArea', function() {
    it('returns enlarged area of two extents', function() {
      const extent1 = [-1, -1, 0, 0];
      const extent2 = [0, 0, 1, 1];
      const enlargedArea = _ol_extent_.getEnlargedArea(extent1, extent2);
      expect(enlargedArea).to.be(4);
    });
  });

  describe('getForViewAndSize', function() {

    it('works for a unit square', function() {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 1, 0, [1, 1]);
      expect(extent[0]).to.be(-0.5);
      expect(extent[2]).to.be(0.5);
      expect(extent[1]).to.be(-0.5);
      expect(extent[3]).to.be(0.5);
    });

    it('works for center', function() {
      const extent = _ol_extent_.getForViewAndSize(
        [5, 10], 1, 0, [1, 1]);
      expect(extent[0]).to.be(4.5);
      expect(extent[2]).to.be(5.5);
      expect(extent[1]).to.be(9.5);
      expect(extent[3]).to.be(10.5);
    });

    it('works for rotation', function() {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 1, Math.PI / 4, [1, 1]);
      expect(extent[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[2]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
      expect(extent[1]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[3]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
    });

    it('works for resolution', function() {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 2, 0, [1, 1]);
      expect(extent[0]).to.be(-1);
      expect(extent[2]).to.be(1);
      expect(extent[1]).to.be(-1);
      expect(extent[3]).to.be(1);
    });

    it('works for size', function() {
      const extent = _ol_extent_.getForViewAndSize(
        [0, 0], 1, 0, [10, 5]);
      expect(extent[0]).to.be(-5);
      expect(extent[2]).to.be(5);
      expect(extent[1]).to.be(-2.5);
      expect(extent[3]).to.be(2.5);
    });

  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      const extent = [0, 1, 2, 4];
      const size = _ol_extent_.getSize(extent);
      expect(size).to.eql([2, 3]);
    });
  });

  describe('getIntersectionArea', function() {
    it('returns correct area when extents intersect', function() {
      const extent1 = [0, 0, 2, 2];
      const extent2 = [1, 1, 3, 3];
      const intersectionArea = _ol_extent_.getIntersectionArea(extent1, extent2);
      expect(intersectionArea).to.be(1);
    });
    it('returns 0 when extents do not intersect', function() {
      const extent1 = [0, 0, 1, 1];
      const extent2 = [2, 2, 3, 3];
      const intersectionArea = _ol_extent_.getIntersectionArea(extent1, extent2);
      expect(intersectionArea).to.be(0);
    });
  });

  describe('getMargin', function() {
    it('returns the correct margin (sum of width and height)', function() {
      const extent = [1, 2, 3, 4];
      expect(_ol_extent_.getMargin(extent)).to.be(4);
    });
  });

  describe('intersects', function() {

    it('returns the expected value', function() {
      const intersects = _ol_extent_.intersects;
      const extent = [50, 50, 100, 100];
      expect(intersects(extent, extent)).to.be(true);
      expect(intersects(extent, [20, 20, 80, 80])).to.be(true);
      expect(intersects(extent, [20, 50, 80, 100])).to.be(true);
      expect(intersects(extent, [20, 80, 80, 120])).to.be(true);
      expect(intersects(extent, [50, 20, 100, 80])).to.be(true);
      expect(intersects(extent, [50, 80, 100, 120])).to.be(true);
      expect(intersects(extent, [80, 20, 120, 80])).to.be(true);
      expect(intersects(extent, [80, 50, 120, 100])).to.be(true);
      expect(intersects(extent, [80, 80, 120, 120])).to.be(true);
      expect(intersects(extent, [20, 20, 120, 120])).to.be(true);
      expect(intersects(extent, [70, 70, 80, 80])).to.be(true);
      expect(intersects(extent, [10, 10, 30, 30])).to.be(false);
      expect(intersects(extent, [30, 10, 70, 30])).to.be(false);
      expect(intersects(extent, [50, 10, 100, 30])).to.be(false);
      expect(intersects(extent, [80, 10, 120, 30])).to.be(false);
      expect(intersects(extent, [120, 10, 140, 30])).to.be(false);
      expect(intersects(extent, [10, 30, 30, 70])).to.be(false);
      expect(intersects(extent, [120, 30, 140, 70])).to.be(false);
      expect(intersects(extent, [10, 50, 30, 100])).to.be(false);
      expect(intersects(extent, [120, 50, 140, 100])).to.be(false);
      expect(intersects(extent, [10, 80, 30, 120])).to.be(false);
      expect(intersects(extent, [120, 80, 140, 120])).to.be(false);
      expect(intersects(extent, [10, 120, 30, 140])).to.be(false);
      expect(intersects(extent, [30, 120, 70, 140])).to.be(false);
      expect(intersects(extent, [50, 120, 100, 140])).to.be(false);
      expect(intersects(extent, [80, 120, 120, 140])).to.be(false);
      expect(intersects(extent, [120, 120, 140, 140])).to.be(false);
    });
  });

  describe('scaleFromCenter', function() {
    it('scales the extent from its center', function() {
      const extent = [1, 1, 3, 3];
      _ol_extent_.scaleFromCenter(extent, 2);
      expect(extent[0]).to.eql(0);
      expect(extent[2]).to.eql(4);
      expect(extent[1]).to.eql(0);
      expect(extent[3]).to.eql(4);
    });
  });

  describe('intersectsSegment()', function() {

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

    it('returns true if contained', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, center, inside);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses top', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, center, north);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses right', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, center, east);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses bottom', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, center, south);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses left', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, center, west);
      expect(intersects).to.be(true);
    });

    it('returns false if above', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, north);
      expect(intersects).to.be(false);
    });

    it('returns false if right', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, northeast, east);
      expect(intersects).to.be(false);
    });

    it('returns false if below', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, south, southwest);
      expect(intersects).to.be(false);
    });

    it('returns false if left', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, west, southwest);
      expect(intersects).to.be(false);
    });

    it('returns true if crosses top to bottom', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, north, south);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses bottom to top', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, south, north);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses left to right', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, west, east);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses right to left', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, east, west);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses northwest to east', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, east);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses south to west', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, south, west);
      expect(intersects).to.be(true);
    });

    it('returns true if touches top', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, northwest, top);
      expect(intersects).to.be(true);
    });

    it('returns true if touches right', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, southeast, right);
      expect(intersects).to.be(true);
    });

    it('returns true if touches bottom', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, bottom, south);
      expect(intersects).to.be(true);
    });

    it('returns true if touches left', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, left, west);
      expect(intersects).to.be(true);
    });

    it('works for zero length inside', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, center, center);
      expect(intersects).to.be(true);
    });

    it('works for zero length outside', function() {
      const intersects = _ol_extent_.intersectsSegment(extent, north, north);
      expect(intersects).to.be(false);
    });

    it('works for left/right intersection spanning top to bottom', function() {
      const extent = [2, 1, 3, 4];
      const start = [0, 0];
      const end = [5, 5];
      expect(_ol_extent_.intersectsSegment(extent, start, end)).to.be(true);
      expect(_ol_extent_.intersectsSegment(extent, end, start)).to.be(true);
    });

    it('works for top/bottom intersection spanning left to right', function() {
      const extent = [1, 2, 4, 3];
      const start = [0, 0];
      const end = [5, 5];
      expect(_ol_extent_.intersectsSegment(extent, start, end)).to.be(true);
      expect(_ol_extent_.intersectsSegment(extent, end, start)).to.be(true);
    });

  });

  describe('#applyTransform()', function() {

    it('does transform', function() {
      const transformFn = getTransform('EPSG:4326', 'EPSG:3857');
      const sourceExtent = [-15, -30, 45, 60];
      const destinationExtent = _ol_extent_.applyTransform(
        sourceExtent, transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      // FIXME check values with third-party tool
      expect(destinationExtent[0])
        .to.roughlyEqual(-1669792.3618991037, 1e-9);
      expect(destinationExtent[2]).to.roughlyEqual(5009377.085697311, 1e-9);
      expect(destinationExtent[1]).to.roughlyEqual(-3503549.843504376, 1e-8);
      expect(destinationExtent[3]).to.roughlyEqual(8399737.889818361, 1e-8);
    });

    it('takes arbitrary function', function() {
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
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      expect(destinationExtent[0]).to.be(-45);
      expect(destinationExtent[2]).to.be(15);
      expect(destinationExtent[1]).to.be(-60);
      expect(destinationExtent[3]).to.be(30);
    });

  });

});
