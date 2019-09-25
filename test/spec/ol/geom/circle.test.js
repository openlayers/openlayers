import Circle from '../../../../src/ol/geom/Circle.js';


describe('ol.geom.Circle', () => {

  describe('with a unit circle', () => {

    let circle;
    beforeEach(() => {
      circle = new Circle([0, 0], 1);
    });

    describe('#clone', () => {

      test('returns a clone', () => {
        const clone = circle.clone();
        expect(clone).toBeInstanceOf(Circle);
        expect(clone.getCenter()).toEqual(circle.getCenter());
        expect(clone.getCenter()).not.toBe(circle.getCenter());
        expect(clone.getRadius()).toBe(circle.getRadius());
      });

    });

    describe('#intersectsCoordinate', () => {

      test('contains the center', () => {
        expect(circle.intersectsCoordinate([0, 0])).toBe(true);
      });

      test('contains points inside the perimeter', () => {
        expect(circle.intersectsCoordinate([0.5, 0.5])).toBe(true);
        expect(circle.intersectsCoordinate([-0.5, 0.5])).toBe(true);
        expect(circle.intersectsCoordinate([-0.5, -0.5])).toBe(true);
        expect(circle.intersectsCoordinate([0.5, -0.5])).toBe(true);
      });

      test('contains points on the perimeter', () => {
        expect(circle.intersectsCoordinate([1, 0])).toBe(true);
        expect(circle.intersectsCoordinate([0, 1])).toBe(true);
        expect(circle.intersectsCoordinate([-1, 0])).toBe(true);
        expect(circle.intersectsCoordinate([0, -1])).toBe(true);
      });

      test('does not contain points outside the perimeter', () => {
        expect(circle.intersectsCoordinate([2, 0])).toBe(false);
        expect(circle.intersectsCoordinate([1, 1])).toBe(false);
        expect(circle.intersectsCoordinate([-2, 0])).toBe(false);
        expect(circle.intersectsCoordinate([0, -2])).toBe(false);
      });

    });

    describe('#getCenter', () => {

      test('returns the expected value', () => {
        expect(circle.getCenter()).toEqual([0, 0]);
      });

    });

    describe('#getClosestPoint', () => {

      test('returns the closest point on the perimeter', () => {
        let closestPoint;
        closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        closestPoint = circle.getClosestPoint([2, 2]);
        expect(closestPoint[0]).to.roughlyEqual(Math.sqrt(0.5), 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(Math.sqrt(0.5), 1e-15);
        closestPoint = circle.getClosestPoint([0, 2]);
        expect(closestPoint[0]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(1, 1e-15);
        closestPoint = circle.getClosestPoint([-2, 2]);
        expect(closestPoint[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(Math.sqrt(0.5), 1e-15);
        closestPoint = circle.getClosestPoint([-2, 0]);
        expect(closestPoint[0]).to.roughlyEqual(-1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        closestPoint = circle.getClosestPoint([-2, -2]);
        expect(closestPoint[0]).to.roughlyEqual(-Math.sqrt(0.5), 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(-Math.sqrt(0.5), 1e-15);
        closestPoint = circle.getClosestPoint([0, -2]);
        expect(closestPoint[0]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(-1, 1e-15);
        closestPoint = circle.getClosestPoint([2, -2]);
        expect(closestPoint[0]).to.roughlyEqual(Math.sqrt(0.5), 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(-Math.sqrt(0.5), 1e-15);
      });

      test('maintains Z coordinates', () => {
        const circle = new Circle([0, 0, 1], 1);
        expect(circle.getLayout()).toBe('XYZ');
        const closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).toHaveLength(3);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).toBe(1);
      });

      test('maintains M coordinates', () => {
        const circle = new Circle([0, 0, 2], 1,
          'XYM');
        const closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).toHaveLength(3);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).toBe(2);
      });

      test('maintains Z and M coordinates', () => {
        const circle = new Circle([0, 0, 1, 2], 1);
        expect(circle.getLayout()).toBe('XYZM');
        const closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).toHaveLength(4);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).toBe(1);
        expect(closestPoint[3]).toBe(2);
      });

    });

    describe('#getExtent', () => {

      test('returns the expected value', () => {
        expect(circle.getExtent()).toEqual([-1, -1, 1, 1]);
      });

    });

    describe('#getRadius', () => {

      test('returns the expected value', () => {
        expect(circle.getRadius()).toBe(1);
      });

    });

    describe('#getSimplifiedGeometry', () => {

      test('returns the same geometry', () => {
        expect(circle.getSimplifiedGeometry(1)).toBe(circle);
      });

    });

    describe('#getType', () => {

      test('returns the expected value', () => {
        expect(circle.getType()).toBe('Circle');
      });

    });

    describe('#setCenter', () => {

      test('sets the center', () => {
        circle.setCenter([1, 2]);
        expect(circle.getCenter()).toEqual([1, 2]);
      });

      test('fires a change event', () => {
        const spy = sinon.spy();
        circle.on('change', spy);
        circle.setCenter([1, 2]);
        expect(spy.calledOnce).toBe(true);
      });

    });

    describe('#setFlatCoordinates', () => {

      test('sets both center and radius', () => {
        circle.setFlatCoordinates('XY', [1, 2, 4, 2]);
        expect(circle.getCenter()).toEqual([1, 2]);
        expect(circle.getRadius()).toBe(3);
      });

    });

    describe('#setRadius', () => {

      test('sets the radius', () => {
        circle.setRadius(2);
        expect(circle.getRadius()).toBe(2);
      });

      test('fires a change event', () => {
        const spy = sinon.spy();
        circle.on('change', spy);
        circle.setRadius(2);
        expect(spy.calledOnce).toBe(true);
      });

    });

    describe('#intersectsExtent', () => {

      test(
        'returns false for non-intersecting extents (wide outside own bbox)',
        () => {
          const wideOutsideLeftTop = [-3, 2, -2, 3];
          const wideOutsideRightTop = [2, 2, 3, 3];
          const wideOutsideRightBottom = [2, -3, 3, -2];
          const wideOutsideLeftBottom = [-3, -3, -2, -2];
          expect(circle.intersectsExtent(wideOutsideLeftTop)).toBe(false);
          expect(circle.intersectsExtent(wideOutsideRightTop)).toBe(false);
          expect(circle.intersectsExtent(wideOutsideRightBottom)).toBe(false);
          expect(circle.intersectsExtent(wideOutsideLeftBottom)).toBe(false);
        }
      );

      test(
        'returns false for non-intersecting extents (inside own bbox)',
        () => {
          const nearOutsideLeftTop = [-1, 0.9, -0.9, 1];
          const nearOutsideRightTop = [0.9, 0.9, 1, 1];
          const nearOutsideRightBottom = [0.9, -1, 1, -0.9];
          const nearOutsideLeftBottom = [-1, -1, -0.9, -0.9];
          expect(circle.intersectsExtent(nearOutsideLeftTop)).toBe(false);
          expect(circle.intersectsExtent(nearOutsideRightTop)).toBe(false);
          expect(circle.intersectsExtent(nearOutsideRightBottom)).toBe(false);
          expect(circle.intersectsExtent(nearOutsideLeftBottom)).toBe(false);
        }
      );

      test('returns true for extents that intersect clearly', () => {
        const intersectingLeftTop = [-1.5, 0.5, -0.5, 1.5];
        const intersectingRightTop = [0.5, 0.5, 1.5, 1.5];
        const intersectingRightBottom = [0.5, -1.5, 1.5, -0.5];
        const intersectingLeftBottom = [-1.5, -1.5, -0.5, -0.5];
        expect(circle.intersectsExtent(intersectingLeftTop)).toBe(true);
        expect(circle.intersectsExtent(intersectingRightTop)).toBe(true);
        expect(circle.intersectsExtent(intersectingRightBottom)).toBe(true);
        expect(circle.intersectsExtent(intersectingLeftBottom)).toBe(true);
      });

      test('returns true for extents that touch the circumference', () => {
        const touchCircumferenceLeft = [-2, 0, -1, 1];
        const touchCircumferenceTop = [0, 1, 1, 2];
        const touchCircumferenceRight = [1, -1, 2, 0];
        const touchCircumferenceBottom = [-1, -2, 0, -1];
        expect(circle.intersectsExtent(touchCircumferenceLeft)).toBe(true);
        expect(circle.intersectsExtent(touchCircumferenceTop)).toBe(true);
        expect(circle.intersectsExtent(touchCircumferenceRight)).toBe(true);
        expect(circle.intersectsExtent(touchCircumferenceBottom)).toBe(true);
      });

      test('returns true for a contained extent', () => {
        const containedExtent = [-0.5, -0.5, 0.5, 0.5];
        expect(circle.intersectsExtent(containedExtent)).toBe(true);
      });

      test('returns true for a covering extent', () => {
        const bigCoveringExtent = [-5, -5, 5, 5];
        expect(circle.intersectsExtent(bigCoveringExtent)).toBe(true);
      });

      test('returns true for the geom\'s own extent', () => {
        const circleExtent = circle.getExtent();
        expect(circle.intersectsExtent(circleExtent)).toBe(true);
      });

    });

    describe('#rotate', () => {

      test('rotates the center around the anchor', () => {
        circle.setCenter([1, 0]);
        circle.rotate(Math.PI / 2, [2, 0]);
        expect(circle.getCenter()).toEqual([2, -1]);
        expect(circle.getExtent()).toEqual([1, -2, 3, 0]);
      });

      test('does not change if the anchor equals the center', () => {
        const center = [1, 0];
        circle.setCenter(center);
        const extent = circle.getExtent();
        circle.rotate(Math.PI / 2, center);
        expect(circle.getCenter()).toEqual(center);
        expect(circle.getExtent()).toEqual(extent);
      });
    });

    describe('#translate', () => {

      test('translates the circle', () => {
        circle.setCenter([1, 1]);
        circle.translate(5, 10);
        expect(circle.getCenter()).toEqual([6, 11]);
        expect(circle.getExtent()).toEqual([5, 10, 7, 12]);
      });
    });
  });

});
