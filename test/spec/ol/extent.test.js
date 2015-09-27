goog.provide('ol.test.extent');

describe('ol.extent', function() {

  describe('buffer', function() {

    it('buffers an extent by some value', function() {
      var extent = [-10, -20, 10, 20];
      expect(ol.extent.buffer(extent, 15)).to.eql([-25, -35, 25, 35]);
    });

  });

  describe('clone', function() {

    it('creates a copy of an extent', function() {
      var extent = ol.extent.createOrUpdate(1, 2, 3, 4);
      var clone = ol.extent.clone(extent);
      expect(ol.extent.equals(extent, clone)).to.be(true);

      ol.extent.extendCoordinate(extent, [10, 20]);
      expect(ol.extent.equals(extent, clone)).to.be(false);
    });

  });

  describe('closestSquaredDistanceXY', function() {

    it('returns correct result when x left of extent', function() {
      var extent = ol.extent.createOrUpdate(0, 0, 1, 1);
      var x = -2;
      var y = 0;
      expect(ol.extent.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result when x right of extent', function() {
      var extent = ol.extent.createOrUpdate(0, 0, 1, 1);
      var x = 3;
      var y = 0;
      expect(ol.extent.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result for other x values', function() {
      var extent = ol.extent.createOrUpdate(0, 0, 1, 1);
      var x = 0.5;
      var y = 3;
      expect(ol.extent.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result when y below extent', function() {
      var extent = ol.extent.createOrUpdate(0, 0, 1, 1);
      var x = 0;
      var y = -2;
      expect(ol.extent.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result when y above extent', function() {
      var extent = ol.extent.createOrUpdate(0, 0, 1, 1);
      var x = 0;
      var y = 3;
      expect(ol.extent.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

    it('returns correct result for other y values', function() {
      var extent = ol.extent.createOrUpdate(0, 0, 1, 1);
      var x = 3;
      var y = 0.5;
      expect(ol.extent.closestSquaredDistanceXY(extent, x, y)).to.be(4);
    });

  });

  describe('createOrUpdateFromCoordinate', function() {

    it('works when no extent passed', function() {
      var coords = [0, 1];
      var expected = [0, 1, 0, 1];
      var got = ol.extent.createOrUpdateFromCoordinate(coords);
      expect(got).to.eql(expected);
    });

    it('updates a passed extent', function() {
      var extent = ol.extent.createOrUpdate(-4, -7, -3, -6);
      var coords = [0, 1];
      var expected = [0, 1, 0, 1];
      ol.extent.createOrUpdateFromCoordinate(coords, extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('createOrUpdateFromCoordinates', function() {

    it('works when single coordinate and no extent passed', function() {
      var coords = [[0, 1]];
      var expected = [0, 1, 0, 1];
      var got = ol.extent.createOrUpdateFromCoordinates(coords);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when single coordinate', function() {
      var extent = ol.extent.createOrUpdate(-4, -7, -3, -6);
      var coords = [[0, 1]];
      var expected = [0, 1, 0, 1];
      ol.extent.createOrUpdateFromCoordinates(coords, extent);
      expect(extent).to.eql(expected);
    });

    it('works when multiple coordinates and no extent passed', function() {
      var coords = [[0, 1], [2, 3]];
      var expected = [0, 1, 2, 3];
      var got = ol.extent.createOrUpdateFromCoordinates(coords);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when multiple coordinates given', function() {
      var extent = ol.extent.createOrUpdate(-4, -7, -3, -6);
      var coords = [[0, 1], [-2, -1]];
      var expected = [-2, -1, 0, 1];
      ol.extent.createOrUpdateFromCoordinates(coords, extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('createOrUpdateFromRings', function() {

    it('works when single ring and no extent passed', function() {
      var ring = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      var rings = [ring];
      var expected = [0, 0, 2, 2];
      var got = ol.extent.createOrUpdateFromRings(rings);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when single ring given', function() {
      var ring = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      var rings = [ring];
      var extent = [1, 1, 4, 7];
      var expected = [0, 0, 2, 2];
      ol.extent.createOrUpdateFromRings(rings, extent);
      expect(extent).to.eql(expected);
    });

    it('works when multiple rings and no extent passed', function() {
      var ring1 = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      var ring2 = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]];
      var rings = [ring1, ring2];
      var expected = [0, 0, 3, 3];
      var got = ol.extent.createOrUpdateFromRings(rings);
      expect(got).to.eql(expected);
    });

    it('changes the passed extent when multiple rings given', function() {
      var ring1 = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
      var ring2 = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]];
      var rings = [ring1, ring2];
      var extent = [1, 1, 4, 7];
      var expected = [0, 0, 3, 3];
      ol.extent.createOrUpdateFromRings(rings, extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('empty', function() {

    it('returns the empty extent', function() {
      var extent = [1, 2, 3, 4];
      var expected = [Infinity, Infinity, -Infinity, -Infinity];
      var got = ol.extent.empty(extent);
      expect(got).to.eql(expected);
    });

    it('empties a passed extent in place', function() {
      var extent = [1, 2, 3, 4];
      var expected = [Infinity, Infinity, -Infinity, -Infinity];
      ol.extent.empty(extent);
      expect(extent).to.eql(expected);
    });

  });

  describe('forEachCorner', function() {

    var callbackFalse;
    var callbackTrue;
    beforeEach(function() {
      callbackFalse = sinon.spy(function() {
        return false;
      });
      callbackTrue = sinon.spy(function() {
        return true;
      });
    });

    it('calls the passed callback for each corner', function() {
      var extent = [1, 2, 3, 4];
      ol.extent.forEachCorner(extent, callbackFalse);
      expect(callbackFalse.callCount).to.be(4);
    });

    it('calls the passed callback with each corner', function() {
      var extent = [1, 2, 3, 4];
      ol.extent.forEachCorner(extent, callbackFalse);
      var firstCallFirstArg = callbackFalse.args[0][0];
      var secondCallFirstArg = callbackFalse.args[1][0];
      var thirdCallFirstArg = callbackFalse.args[2][0];
      var fourthCallFirstArg = callbackFalse.args[3][0];
      expect(firstCallFirstArg).to.eql([1, 2]); // bl
      expect(secondCallFirstArg).to.eql([3, 2]); // br
      expect(thirdCallFirstArg).to.eql([3, 4]); // tr
      expect(fourthCallFirstArg).to.eql([1, 4]); // tl
    });

    it('calls a truthy callback only once', function() {
      var extent = [1, 2, 3, 4];
      ol.extent.forEachCorner(extent, callbackTrue);
      expect(callbackTrue.callCount).to.be(1);
    });

    it('ensures that any corner can cancel the callback execution', function() {
      var extent = [1, 2, 3, 4];
      var bottomLeftSpy = sinon.spy(function(corner) {
        return (corner[0] === 1 && corner[1] === 2) ? true : false;
      });
      var bottomRightSpy = sinon.spy(function(corner) {
        return (corner[0] === 3 && corner[1] === 2) ? true : false;
      });
      var topRightSpy = sinon.spy(function(corner) {
        return (corner[0] === 3 && corner[1] === 4) ? true : false;
      });
      var topLeftSpy = sinon.spy(function(corner) {
        return (corner[0] === 1 && corner[1] === 4) ? true : false;
      });

      ol.extent.forEachCorner(extent, bottomLeftSpy);
      ol.extent.forEachCorner(extent, bottomRightSpy);
      ol.extent.forEachCorner(extent, topRightSpy);
      ol.extent.forEachCorner(extent, topLeftSpy);

      expect(bottomLeftSpy.callCount).to.be(1);
      expect(bottomRightSpy.callCount).to.be(2);
      expect(topRightSpy.callCount).to.be(3);
      expect(topLeftSpy.callCount).to.be(4);
    });

    it('returns false eventually, if no invocation returned a truthy value',
        function() {
          var extent = [1, 2, 3, 4];
          var spy = sinon.spy(); // will return undefined for each corner
          var got = ol.extent.forEachCorner(extent, spy);
          expect(spy.callCount).to.be(4);
          expect(got).to.be(false);
        }
    );

    it('calls the callback with given scope', function() {
      var extent = [1, 2, 3, 4];
      var scope = {humpty: 'dumpty'};
      ol.extent.forEachCorner(extent, callbackTrue, scope);
      expect(callbackTrue.calledOn(scope)).to.be(true);
    });

  });

  describe('getArea', function() {
    it('returns zero for empty extents', function() {
      var emptyExtent = ol.extent.createEmpty();
      var areaEmpty = ol.extent.getArea(emptyExtent);
      expect(areaEmpty).to.be(0);

      var extentDeltaXZero = [45, 67, 45, 78];
      var areaDeltaXZero = ol.extent.getArea(extentDeltaXZero);
      expect(areaDeltaXZero).to.be(0);

      var extentDeltaYZero = [11, 67, 45, 67];
      var areaDeltaYZero = ol.extent.getArea(extentDeltaYZero);
      expect(areaDeltaYZero).to.be(0);
    });
    it('calculates correct area for other extents', function() {
      var extent = [0, 0, 10, 10];
      var area = ol.extent.getArea(extent);
      expect(area).to.be(100);
    });
  });

  describe('getIntersection()', function() {
    it('returns the intersection of two extents', function() {
      var world = [-180, -90, 180, 90];
      var north = [-180, 0, 180, 90];
      var farNorth = [-180, 45, 180, 90];
      var east = [0, -90, 180, 90];
      var farEast = [90, -90, 180, 90];
      var south = [-180, -90, 180, 0];
      var farSouth = [-180, -90, 180, -45];
      var west = [-180, -90, 0, 90];
      var farWest = [-180, -90, -90, 90];
      var none = ol.extent.createEmpty();
      expect(ol.extent.getIntersection(world, none)).to.eql(none);
      expect(ol.extent.getIntersection(world, north)).to.eql(north);
      expect(ol.extent.getIntersection(world, east)).to.eql(east);
      expect(ol.extent.getIntersection(world, south)).to.eql(south);
      expect(ol.extent.getIntersection(world, west)).to.eql(west);
      expect(ol.extent.getIntersection(farEast, farWest)).to.eql(none);
      expect(ol.extent.getIntersection(farNorth, farSouth)).to.eql(none);
      expect(ol.extent.getIntersection(north, west)).to.eql([-180, 0, 0, 90]);
      expect(ol.extent.getIntersection(east, south)).to.eql([0, -90, 180, 0]);
    });
  });

  describe('containsCoordinate', function() {

    describe('positive', function() {
      it('returns true', function() {
        var extent = [1, 2, 3, 4];
        expect(ol.extent.containsCoordinate(extent, [1, 2])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [1, 3])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [1, 4])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [2, 2])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [2, 3])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [2, 4])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [3, 2])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [3, 3])).to.be.ok();
        expect(ol.extent.containsCoordinate(extent, [3, 4])).to.be.ok();
      });
    });

    describe('negative', function() {
      it('returns false', function() {
        var extent = [1, 2, 3, 4];
        expect(ol.extent.containsCoordinate(extent, [0, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 2])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 3])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 4])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [0, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [1, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [1, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [2, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [2, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [3, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [3, 5])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 1])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 2])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 3])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 4])).to.not.be();
        expect(ol.extent.containsCoordinate(extent, [4, 5])).to.not.be();
      });
    });
  });

  describe('coordinateRelationship()', function() {

    var extent = [-180, -90, 180, 90];
    var INTERSECTING = ol.extent.Relationship.INTERSECTING;
    var ABOVE = ol.extent.Relationship.ABOVE;
    var RIGHT = ol.extent.Relationship.RIGHT;
    var BELOW = ol.extent.Relationship.BELOW;
    var LEFT = ol.extent.Relationship.LEFT;

    it('returns intersecting for within', function() {
      var rel = ol.extent.coordinateRelationship(extent, [0, 0]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching top', function() {
      var rel = ol.extent.coordinateRelationship(extent, [0, 90]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching right', function() {
      var rel = ol.extent.coordinateRelationship(extent, [180, 0]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching bottom', function() {
      var rel = ol.extent.coordinateRelationship(extent, [0, -90]);
      expect(rel).to.be(INTERSECTING);
    });

    it('returns intersecting for touching left', function() {
      var rel = ol.extent.coordinateRelationship(extent, [-180, 0]);
      expect(rel).to.be(INTERSECTING);
    });

    it('above for north', function() {
      var rel = ol.extent.coordinateRelationship(extent, [0, 100]);
      expect(rel).to.be(ABOVE);
    });

    it('above and right for northeast', function() {
      var rel = ol.extent.coordinateRelationship(extent, [190, 100]);
      expect(rel & ABOVE).to.be(ABOVE);
      expect(rel & RIGHT).to.be(RIGHT);
    });

    it('right for east', function() {
      var rel = ol.extent.coordinateRelationship(extent, [190, 0]);
      expect(rel).to.be(RIGHT);
    });

    it('below and right for southeast', function() {
      var rel = ol.extent.coordinateRelationship(extent, [190, -100]);
      expect(rel & BELOW).to.be(BELOW);
      expect(rel & RIGHT).to.be(RIGHT);
    });

    it('below for south', function() {
      var rel = ol.extent.coordinateRelationship(extent, [0, -100]);
      expect(rel).to.be(BELOW);
    });

    it('below and left for southwest', function() {
      var rel = ol.extent.coordinateRelationship(extent, [-190, -100]);
      expect(rel & BELOW).to.be(BELOW);
      expect(rel & LEFT).to.be(LEFT);
    });

    it('left for west', function() {
      var rel = ol.extent.coordinateRelationship(extent, [-190, 0]);
      expect(rel).to.be(LEFT);
    });

    it('above and left for northwest', function() {
      var rel = ol.extent.coordinateRelationship(extent, [-190, 100]);
      expect(rel & ABOVE).to.be(ABOVE);
      expect(rel & LEFT).to.be(LEFT);
    });

  });

  describe('getCenter', function() {
    it('returns the expected center', function() {
      var extent = [1, 2, 3, 4];
      var center = ol.extent.getCenter(extent);
      expect(center[0]).to.eql(2);
      expect(center[1]).to.eql(3);
    });
    it('returns [NaN, NaN] for empty extents', function() {
      var extent = ol.extent.createEmpty();
      var center = ol.extent.getCenter(extent);
      expect('' + center[0]).to.be('NaN');
      expect('' + center[1]).to.be('NaN');
    });
  });

  describe('getCorner', function() {
    var extent = [1, 2, 3, 4];

    it('gets the bottom left', function() {
      var corner = ol.extent.Corner.BOTTOM_LEFT;
      expect(ol.extent.getCorner(extent, corner)).to.eql([1, 2]);
    });

    it('gets the bottom right', function() {
      var corner = ol.extent.Corner.BOTTOM_RIGHT;
      expect(ol.extent.getCorner(extent, corner)).to.eql([3, 2]);
    });

    it('gets the top left', function() {
      var corner = ol.extent.Corner.TOP_LEFT;
      expect(ol.extent.getCorner(extent, corner)).to.eql([1, 4]);
    });

    it('gets the top right', function() {
      var corner = ol.extent.Corner.TOP_RIGHT;
      expect(ol.extent.getCorner(extent, corner)).to.eql([3, 4]);
    });

    it('throws exception for unexpected corner', function() {
      expect(function() {
        ol.extent.getCorner(extent, 'foobar');
      }).to.throwException();
    });

  });

  describe('getEnlargedArea', function() {
    it('returns enlarged area of two extents', function() {
      var extent1 = [-1, -1, 0, 0];
      var extent2 = [0, 0, 1, 1];
      var enlargedArea = ol.extent.getEnlargedArea(extent1, extent2);
      expect(enlargedArea).to.be(4);
    });
  });

  describe('getForViewAndSize', function() {

    it('works for a unit square', function() {
      var extent = ol.extent.getForViewAndSize(
          [0, 0], 1, 0, [1, 1]);
      expect(extent[0]).to.be(-0.5);
      expect(extent[2]).to.be(0.5);
      expect(extent[1]).to.be(-0.5);
      expect(extent[3]).to.be(0.5);
    });

    it('works for center', function() {
      var extent = ol.extent.getForViewAndSize(
          [5, 10], 1, 0, [1, 1]);
      expect(extent[0]).to.be(4.5);
      expect(extent[2]).to.be(5.5);
      expect(extent[1]).to.be(9.5);
      expect(extent[3]).to.be(10.5);
    });

    it('works for rotation', function() {
      var extent = ol.extent.getForViewAndSize(
          [0, 0], 1, Math.PI / 4, [1, 1]);
      expect(extent[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[2]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
      expect(extent[1]).to.roughlyEqual(-Math.sqrt(0.5), 1e-9);
      expect(extent[3]).to.roughlyEqual(Math.sqrt(0.5), 1e-9);
    });

    it('works for resolution', function() {
      var extent = ol.extent.getForViewAndSize(
          [0, 0], 2, 0, [1, 1]);
      expect(extent[0]).to.be(-1);
      expect(extent[2]).to.be(1);
      expect(extent[1]).to.be(-1);
      expect(extent[3]).to.be(1);
    });

    it('works for size', function() {
      var extent = ol.extent.getForViewAndSize(
          [0, 0], 1, 0, [10, 5]);
      expect(extent[0]).to.be(-5);
      expect(extent[2]).to.be(5);
      expect(extent[1]).to.be(-2.5);
      expect(extent[3]).to.be(2.5);
    });

  });

  describe('getSize', function() {
    it('returns the expected size', function() {
      var extent = [0, 1, 2, 4];
      var size = ol.extent.getSize(extent);
      expect(size).to.eql([2, 3]);
    });
  });

  describe('getIntersectionArea', function() {
    it('returns correct area when extents intersect', function() {
      var extent1 = [0, 0, 2, 2];
      var extent2 = [1, 1, 3, 3];
      var intersectionArea = ol.extent.getIntersectionArea(extent1, extent2);
      expect(intersectionArea).to.be(1);
    });
    it('returns 0 when extents do not intersect', function() {
      var extent1 = [0, 0, 1, 1];
      var extent2 = [2, 2, 3, 3];
      var intersectionArea = ol.extent.getIntersectionArea(extent1, extent2);
      expect(intersectionArea).to.be(0);
    });
  });

  describe('getMargin', function() {
    it('returns the correct margin (sum of width and height)', function() {
      var extent = [1, 2, 3, 4];
      expect(ol.extent.getMargin(extent)).to.be(4);
    });
  });

  describe('intersects', function() {

    it('returns the expected value', function() {
      var intersects = ol.extent.intersects;
      var extent = [50, 50, 100, 100];
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

  describe('isInfinite', function() {
    it('returns true for infinite extents', function() {
      var extents = [
        [-Infinity, 0, 0, 0],
        [0, -Infinity, 0, 0],
        [0, 0, +Infinity, 0],
        [0, 0, 0, +Infinity]
      ];
      expect(ol.extent.isInfinite(extents[0])).to.be(true);
      expect(ol.extent.isInfinite(extents[1])).to.be(true);
      expect(ol.extent.isInfinite(extents[2])).to.be(true);
      expect(ol.extent.isInfinite(extents[3])).to.be(true);
    });
    it('returns false for other extents', function() {
      var extents = [
        ol.extent.createEmpty(),
        [1, 2, 3, 4]
      ];
      expect(ol.extent.isInfinite(extents[0])).to.be(false);
      expect(ol.extent.isInfinite(extents[1])).to.be(false);
    });
  });

  describe('touches', function() {

    it('returns the expected value', function() {
      var touches = ol.extent.touches;
      var extent = [50, 50, 100, 100];
      expect(touches(extent, [20, 20, 80, 80])).to.be(false);
      expect(touches(extent, [20, 20, 50, 80])).to.be(true);
      expect(touches(extent, [20, 20, 50, 40])).to.be(false);
      expect(touches(extent, [100, 20, 140, 80])).to.be(true);
      expect(touches(extent, [100, 20, 140, 40])).to.be(false);
      expect(touches(extent, [20, 20, 80, 50])).to.be(true);
      expect(touches(extent, [20, 20, 40, 50])).to.be(false);
      expect(touches(extent, [20, 100, 80, 140])).to.be(true);
      expect(touches(extent, [20, 100, 40, 140])).to.be(false);
    });
  });

  describe('normalize', function() {
    it('returns the expected coordinate', function() {
      var extent = [0, 1, 2, 3];
      var coordinate;

      coordinate = ol.extent.normalize(extent, [1, 2]);
      expect(coordinate[0]).to.eql(0.5);
      expect(coordinate[1]).to.eql(0.5);

      coordinate = ol.extent.normalize(extent, [0, 3]);
      expect(coordinate[0]).to.eql(0);
      expect(coordinate[1]).to.eql(1);

      coordinate = ol.extent.normalize(extent, [2, 1]);
      expect(coordinate[0]).to.eql(1);
      expect(coordinate[1]).to.eql(0);

      coordinate = ol.extent.normalize(extent, [0, 0]);
      expect(coordinate[0]).to.eql(0);
      expect(coordinate[1]).to.eql(-0.5);

      coordinate = ol.extent.normalize(extent, [-1, 1]);
      expect(coordinate[0]).to.eql(-0.5);
      expect(coordinate[1]).to.eql(0);
    });
  });

  describe('scaleFromCenter', function() {
    it('scales the extent from its center', function() {
      var extent = [1, 1, 3, 3];
      ol.extent.scaleFromCenter(extent, 2);
      expect(extent[0]).to.eql(0);
      expect(extent[2]).to.eql(4);
      expect(extent[1]).to.eql(0);
      expect(extent[3]).to.eql(4);
    });
  });

  describe('intersectsSegment()', function() {

    var extent = [-180, -90, 180, 90];
    var north = [0, 100];
    var northeast = [190, 100];
    var east = [190, 0];
    var southeast = [190, -100];
    var south = [0, -100];
    var southwest = [-190, -100];
    var west = [-190, 0];
    var northwest = [-190, 100];
    var center = [0, 0];
    var top = [0, 90];
    var right = [180, 0];
    var bottom = [-90, 0];
    var left = [-180, 0];
    var inside = [10, 10];

    it('returns true if contained', function() {
      var intersects = ol.extent.intersectsSegment(extent, center, inside);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses top', function() {
      var intersects = ol.extent.intersectsSegment(extent, center, north);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses right', function() {
      var intersects = ol.extent.intersectsSegment(extent, center, east);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses bottom', function() {
      var intersects = ol.extent.intersectsSegment(extent, center, south);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses left', function() {
      var intersects = ol.extent.intersectsSegment(extent, center, west);
      expect(intersects).to.be(true);
    });

    it('returns false if above', function() {
      var intersects = ol.extent.intersectsSegment(extent, northwest, north);
      expect(intersects).to.be(false);
    });

    it('returns false if right', function() {
      var intersects = ol.extent.intersectsSegment(extent, northeast, east);
      expect(intersects).to.be(false);
    });

    it('returns false if below', function() {
      var intersects = ol.extent.intersectsSegment(extent, south, southwest);
      expect(intersects).to.be(false);
    });

    it('returns false if left', function() {
      var intersects = ol.extent.intersectsSegment(extent, west, southwest);
      expect(intersects).to.be(false);
    });

    it('returns true if crosses top to bottom', function() {
      var intersects = ol.extent.intersectsSegment(extent, north, south);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses bottom to top', function() {
      var intersects = ol.extent.intersectsSegment(extent, south, north);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses left to right', function() {
      var intersects = ol.extent.intersectsSegment(extent, west, east);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses right to left', function() {
      var intersects = ol.extent.intersectsSegment(extent, east, west);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses northwest to east', function() {
      var intersects = ol.extent.intersectsSegment(extent, northwest, east);
      expect(intersects).to.be(true);
    });

    it('returns true if crosses south to west', function() {
      var intersects = ol.extent.intersectsSegment(extent, south, west);
      expect(intersects).to.be(true);
    });

    it('returns true if touches top', function() {
      var intersects = ol.extent.intersectsSegment(extent, northwest, top);
      expect(intersects).to.be(true);
    });

    it('returns true if touches right', function() {
      var intersects = ol.extent.intersectsSegment(extent, southeast, right);
      expect(intersects).to.be(true);
    });

    it('returns true if touches bottom', function() {
      var intersects = ol.extent.intersectsSegment(extent, bottom, south);
      expect(intersects).to.be(true);
    });

    it('returns true if touches left', function() {
      var intersects = ol.extent.intersectsSegment(extent, left, west);
      expect(intersects).to.be(true);
    });

    it('works for zero length inside', function() {
      var intersects = ol.extent.intersectsSegment(extent, center, center);
      expect(intersects).to.be(true);
    });

    it('works for zero length outside', function() {
      var intersects = ol.extent.intersectsSegment(extent, north, north);
      expect(intersects).to.be(false);
    });

    it('works for left/right intersection spanning top to bottom', function() {
      var extent = [2, 1, 3, 4];
      var start = [0, 0];
      var end = [5, 5];
      expect(ol.extent.intersectsSegment(extent, start, end)).to.be(true);
      expect(ol.extent.intersectsSegment(extent, end, start)).to.be(true);
    });

    it('works for top/bottom intersection spanning left to right', function() {
      var extent = [1, 2, 4, 3];
      var start = [0, 0];
      var end = [5, 5];
      expect(ol.extent.intersectsSegment(extent, start, end)).to.be(true);
      expect(ol.extent.intersectsSegment(extent, end, start)).to.be(true);
    });

  });

  describe('#applyTransform()', function() {

    it('does transform', function() {
      var transformFn = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
      var sourceExtent = [-15, -30, 45, 60];
      var destinationExtent = ol.extent.applyTransform(
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
      var transformFn = function(input, output, opt_dimension) {
        var dimension = opt_dimension !== undefined ? opt_dimension : 2;
        if (output === undefined) {
          output = new Array(input.length);
        }
        var n = input.length;
        var i;
        for (i = 0; i < n; i += dimension) {
          output[i] = -input[i];
          output[i + 1] = -input[i + 1];
        }
        return output;
      };
      var sourceExtent = [-15, -30, 45, 60];
      var destinationExtent = ol.extent.applyTransform(
          sourceExtent, transformFn);
      expect(destinationExtent).not.to.be(undefined);
      expect(destinationExtent).not.to.be(null);
      expect(destinationExtent[0]).to.be(-45);
      expect(destinationExtent[2]).to.be(15);
      expect(destinationExtent[1]).to.be(-60);
      expect(destinationExtent[3]).to.be(30);
    });

  });

  describe('transform2D()', function() {

    var extent;
    beforeEach(function() {
      extent = [-180, -90, 180, 90];
    });

    it('applies a translate transform', function() {
      var mat = goog.vec.Mat4.createNumber();
      goog.vec.Mat4.makeTranslate(mat, 10, 20, 0);
      var transformed = ol.extent.transform2D(extent, mat);
      expect(transformed).to.eql([-170, -70, 190, 110]);
    });

    it('applies a rotate transform', function() {
      var mat = goog.vec.Mat4.createNumber();
      goog.vec.Mat4.makeRotateZ(mat, Math.PI / 2);
      var transformed = ol.extent.transform2D(extent, mat);
      expect(transformed[0]).to.roughlyEqual(-90, 1e-5);
      expect(transformed[1]).to.roughlyEqual(-180, 1e-5);
      expect(transformed[2]).to.roughlyEqual(90, 1e-5);
      expect(transformed[3]).to.roughlyEqual(180, 1e-5);
    });

    it('does not modify original', function() {
      var mat = goog.vec.Mat4.createNumber();
      goog.vec.Mat4.makeRotateZ(mat, Math.PI / 2);
      ol.extent.transform2D(extent, mat);
      expect(extent).to.eql([-180, -90, 180, 90]);
    });

    it('accepts an extent to modify', function() {
      var mat = goog.vec.Mat4.createNumber();
      goog.vec.Mat4.makeScale(mat, 2, 0.5);
      ol.extent.transform2D(extent, mat, extent);
      expect(extent).to.eql([-360, -45, 360, 45]);
    });

  });

});


goog.require('goog.vec.Mat4');
goog.require('ol.extent');
goog.require('ol.extent.Corner');
goog.require('ol.extent.Relationship');
goog.require('ol.proj');
