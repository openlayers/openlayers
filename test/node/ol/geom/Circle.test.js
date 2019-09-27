import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Circle from '../../../../src/ol/geom/Circle.js';

describe('ol/geom/Circle.js', function () {
  describe('with a unit circle', function () {
    let circle;
    beforeEach(function () {
      circle = new Circle([0, 0], 1);
    });

    describe('#clone', function () {
      it('returns a clone', function () {
        circle.setProperties({foo: 'bar', baz: null});

        const clone = circle.clone();
        assert.instanceOf(clone, Circle);
        assert.deepEqual(clone.getCenter(), circle.getCenter());
        assert.notEqual(clone.getCenter(), circle.getCenter());
        assert.strictEqual(clone.getRadius(), circle.getRadius());
        assert.deepEqual(clone.getProperties(), {foo: 'bar', baz: null});
      });
    });

    describe('#intersectsCoordinate', function () {
      it('contains the center', function () {
        assert.strictEqual(circle.intersectsCoordinate([0, 0]), true);
      });

      it('contains points inside the perimeter', function () {
        assert.strictEqual(circle.intersectsCoordinate([0.5, 0.5]), true);
        assert.strictEqual(circle.intersectsCoordinate([-0.5, 0.5]), true);
        assert.strictEqual(circle.intersectsCoordinate([-0.5, -0.5]), true);
        assert.strictEqual(circle.intersectsCoordinate([0.5, -0.5]), true);
      });

      it('contains points on the perimeter', function () {
        assert.strictEqual(circle.intersectsCoordinate([1, 0]), true);
        assert.strictEqual(circle.intersectsCoordinate([0, 1]), true);
        assert.strictEqual(circle.intersectsCoordinate([-1, 0]), true);
        assert.strictEqual(circle.intersectsCoordinate([0, -1]), true);
      });

      it('does not contain points outside the perimeter', function () {
        assert.strictEqual(circle.intersectsCoordinate([2, 0]), false);
        assert.strictEqual(circle.intersectsCoordinate([1, 1]), false);
        assert.strictEqual(circle.intersectsCoordinate([-2, 0]), false);
        assert.strictEqual(circle.intersectsCoordinate([0, -2]), false);
      });
    });

    describe('#getCenter', function () {
      it('returns the expected value', function () {
        assert.deepEqual(circle.getCenter(), [0, 0]);
      });
    });

    describe('#getClosestPoint', function () {
      it('returns the closest point on the perimeter', function () {
        let closestPoint;
        closestPoint = circle.getClosestPoint([2, 0]);
        assert.approximately(closestPoint[0], 1, 1e-15);
        assert.approximately(closestPoint[1], 0, 1e-15);
        closestPoint = circle.getClosestPoint([2, 2]);
        assert.approximately(closestPoint[0], Math.sqrt(0.5), 1e-15);
        assert.approximately(closestPoint[1], Math.sqrt(0.5), 1e-15);
        closestPoint = circle.getClosestPoint([0, 2]);
        assert.approximately(closestPoint[0], 0, 1e-15);
        assert.approximately(closestPoint[1], 1, 1e-15);
        closestPoint = circle.getClosestPoint([-2, 2]);
        assert.approximately(closestPoint[0], -Math.sqrt(0.5), 1e-15);
        assert.approximately(closestPoint[1], Math.sqrt(0.5), 1e-15);
        closestPoint = circle.getClosestPoint([-2, 0]);
        assert.approximately(closestPoint[0], -1, 1e-15);
        assert.approximately(closestPoint[1], 0, 1e-15);
        closestPoint = circle.getClosestPoint([-2, -2]);
        assert.approximately(closestPoint[0], -Math.sqrt(0.5), 1e-15);
        assert.approximately(closestPoint[1], -Math.sqrt(0.5), 1e-15);
        closestPoint = circle.getClosestPoint([0, -2]);
        assert.approximately(closestPoint[0], 0, 1e-15);
        assert.approximately(closestPoint[1], -1, 1e-15);
        closestPoint = circle.getClosestPoint([2, -2]);
        assert.approximately(closestPoint[0], Math.sqrt(0.5), 1e-15);
        assert.approximately(closestPoint[1], -Math.sqrt(0.5), 1e-15);
      });

      it('maintains Z coordinates', function () {
        const circle = new Circle([0, 0, 1], 1);
        assert.strictEqual(circle.getLayout(), 'XYZ');
        const closestPoint = circle.getClosestPoint([2, 0]);
        assert.lengthOf(closestPoint, 3);
        assert.approximately(closestPoint[0], 1, 1e-15);
        assert.approximately(closestPoint[1], 0, 1e-15);
        assert.strictEqual(closestPoint[2], 1);
      });

      it('maintains M coordinates', function () {
        const circle = new Circle([0, 0, 2], 1, 'XYM');
        const closestPoint = circle.getClosestPoint([2, 0]);
        assert.lengthOf(closestPoint, 3);
        assert.approximately(closestPoint[0], 1, 1e-15);
        assert.approximately(closestPoint[1], 0, 1e-15);
        assert.strictEqual(closestPoint[2], 2);
      });

      it('maintains Z and M coordinates', function () {
        const circle = new Circle([0, 0, 1, 2], 1);
        assert.strictEqual(circle.getLayout(), 'XYZM');
        const closestPoint = circle.getClosestPoint([2, 0]);
        assert.lengthOf(closestPoint, 4);
        assert.approximately(closestPoint[0], 1, 1e-15);
        assert.approximately(closestPoint[1], 0, 1e-15);
        assert.strictEqual(closestPoint[2], 1);
        assert.strictEqual(closestPoint[3], 2);
      });
    });

    describe('#getExtent', function () {
      it('returns the expected value', function () {
        assert.deepEqual(circle.getExtent(), [-1, -1, 1, 1]);
      });
    });

    describe('#getRadius', function () {
      it('returns the expected value', function () {
        assert.strictEqual(circle.getRadius(), 1);
      });
    });

    describe('#getSimplifiedGeometry', function () {
      it('returns the same geometry', function () {
        assert.strictEqual(circle.getSimplifiedGeometry(1), circle);
      });
    });

    describe('#getType', function () {
      it('returns the expected value', function () {
        assert.strictEqual(circle.getType(), 'Circle');
      });
    });

    describe('#setCenter', function () {
      it('sets the center', function () {
        circle.setCenter([1, 2]);
        assert.deepEqual(circle.getCenter(), [1, 2]);
      });

      it('fires a change event', function () {
        const spy = sinonSpy();
        circle.on('change', spy);
        circle.setCenter([1, 2]);
        assert.strictEqual(spy.calledOnce, true);
      });
    });

    describe('#setFlatCoordinates', function () {
      it('sets both center and radius', function () {
        circle.setFlatCoordinates('XY', [1, 2, 4, 2]);
        assert.deepEqual(circle.getCenter(), [1, 2]);
        assert.strictEqual(circle.getRadius(), 3);
      });
    });

    describe('#setRadius', function () {
      it('sets the radius', function () {
        circle.setRadius(2);
        assert.strictEqual(circle.getRadius(), 2);
      });

      it('fires a change event', function () {
        const spy = sinonSpy();
        circle.on('change', spy);
        circle.setRadius(2);
        assert.strictEqual(spy.calledOnce, true);
      });
    });

    describe('#intersectsExtent', function () {
      it('returns false for non-intersecting extents (wide outside own bbox)', function () {
        const wideOutsideLeftTop = [-3, 2, -2, 3];
        const wideOutsideRightTop = [2, 2, 3, 3];
        const wideOutsideRightBottom = [2, -3, 3, -2];
        const wideOutsideLeftBottom = [-3, -3, -2, -2];
        assert.strictEqual(circle.intersectsExtent(wideOutsideLeftTop), false);
        assert.strictEqual(circle.intersectsExtent(wideOutsideRightTop), false);
        assert.strictEqual(
          circle.intersectsExtent(wideOutsideRightBottom),
          false,
        );
        assert.strictEqual(
          circle.intersectsExtent(wideOutsideLeftBottom),
          false,
        );
      });

      it('returns false for non-intersecting extents (inside own bbox)', function () {
        const nearOutsideLeftTop = [-1, 0.9, -0.9, 1];
        const nearOutsideRightTop = [0.9, 0.9, 1, 1];
        const nearOutsideRightBottom = [0.9, -1, 1, -0.9];
        const nearOutsideLeftBottom = [-1, -1, -0.9, -0.9];
        assert.strictEqual(circle.intersectsExtent(nearOutsideLeftTop), false);
        assert.strictEqual(circle.intersectsExtent(nearOutsideRightTop), false);
        assert.strictEqual(
          circle.intersectsExtent(nearOutsideRightBottom),
          false,
        );
        assert.strictEqual(
          circle.intersectsExtent(nearOutsideLeftBottom),
          false,
        );
      });

      it('returns true for extents that intersect clearly', function () {
        const intersectingLeftTop = [-1.5, 0.5, -0.5, 1.5];
        const intersectingRightTop = [0.5, 0.5, 1.5, 1.5];
        const intersectingRightBottom = [0.5, -1.5, 1.5, -0.5];
        const intersectingLeftBottom = [-1.5, -1.5, -0.5, -0.5];
        assert.strictEqual(circle.intersectsExtent(intersectingLeftTop), true);
        assert.strictEqual(circle.intersectsExtent(intersectingRightTop), true);
        assert.strictEqual(
          circle.intersectsExtent(intersectingRightBottom),
          true,
        );
        assert.strictEqual(
          circle.intersectsExtent(intersectingLeftBottom),
          true,
        );
      });

      it('returns true for extents that touch the circumference', function () {
        const touchCircumferenceLeft = [-2, 0, -1, 1];
        const touchCircumferenceTop = [0, 1, 1, 2];
        const touchCircumferenceRight = [1, -1, 2, 0];
        const touchCircumferenceBottom = [-1, -2, 0, -1];
        assert.strictEqual(
          circle.intersectsExtent(touchCircumferenceLeft),
          true,
        );
        assert.strictEqual(
          circle.intersectsExtent(touchCircumferenceTop),
          true,
        );
        assert.strictEqual(
          circle.intersectsExtent(touchCircumferenceRight),
          true,
        );
        assert.strictEqual(
          circle.intersectsExtent(touchCircumferenceBottom),
          true,
        );
      });

      it('returns true for a contained extent', function () {
        const containedExtent = [-0.5, -0.5, 0.5, 0.5];
        assert.strictEqual(circle.intersectsExtent(containedExtent), true);
      });

      it('returns true for a covering extent', function () {
        const bigCoveringExtent = [-5, -5, 5, 5];
        assert.strictEqual(circle.intersectsExtent(bigCoveringExtent), true);
      });

      it("returns true for the geom's own extent", function () {
        const circleExtent = circle.getExtent();
        assert.strictEqual(circle.intersectsExtent(circleExtent), true);
      });
    });

    describe('#rotate', function () {
      it('rotates the center around the anchor', function () {
        circle.setCenter([1, 0]);
        circle.rotate(Math.PI / 2, [2, 0]);
        assert.deepEqual(circle.getCenter(), [2, -1]);
        assert.deepEqual(circle.getExtent(), [1, -2, 3, 0]);
      });

      it('does not change if the anchor equals the center', function () {
        const center = [1, 0];
        circle.setCenter(center);
        const extent = circle.getExtent();
        circle.rotate(Math.PI / 2, center);
        assert.deepEqual(circle.getCenter(), center);
        assert.deepEqual(circle.getExtent(), extent);
      });
    });

    describe('#translate', function () {
      it('translates the circle', function () {
        circle.setCenter([1, 1]);
        circle.translate(5, 10);
        assert.deepEqual(circle.getCenter(), [6, 11]);
        assert.deepEqual(circle.getExtent(), [5, 10, 7, 12]);
      });
    });
  });
});
