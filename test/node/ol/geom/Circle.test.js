import Circle from '../../../../src/ol/geom/Circle.js';
import expect from '../../expect.js';
import proj4 from 'proj4';
import sinon from 'sinon';
import {
  addCommon,
  clearAllProjections,
  fromLonLat,
} from '../../../../src/ol/proj.js';
import {register, unregister} from '../../../../src/ol/proj/proj4.js';

describe('ol/geom/Circle.js', function () {
  describe('with a unit circle', function () {
    let circle;
    beforeEach(function () {
      circle = new Circle([0, 0], 1);
    });
    afterEach(function () {
      delete proj4.defs['EPSG:32632'];
      clearAllProjections();
      addCommon();
      unregister();
    });

    describe('#clone', function () {
      it('returns a clone', function () {
        circle.setProperties({foo: 'bar', baz: null});

        const clone = circle.clone();
        expect(clone).to.be.an(Circle);
        expect(clone.getCenter()).to.eql(circle.getCenter());
        expect(clone.getCenter()).not.to.be(circle.getCenter());
        expect(clone.getRadius()).to.be(circle.getRadius());
        expect(clone.getProperties()).to.eql({foo: 'bar', baz: null});
      });
    });

    describe('#intersectsCoordinate', function () {
      it('contains the center', function () {
        expect(circle.intersectsCoordinate([0, 0])).to.be(true);
      });

      it('contains points inside the perimeter', function () {
        expect(circle.intersectsCoordinate([0.5, 0.5])).to.be(true);
        expect(circle.intersectsCoordinate([-0.5, 0.5])).to.be(true);
        expect(circle.intersectsCoordinate([-0.5, -0.5])).to.be(true);
        expect(circle.intersectsCoordinate([0.5, -0.5])).to.be(true);
      });

      it('contains points on the perimeter', function () {
        expect(circle.intersectsCoordinate([1, 0])).to.be(true);
        expect(circle.intersectsCoordinate([0, 1])).to.be(true);
        expect(circle.intersectsCoordinate([-1, 0])).to.be(true);
        expect(circle.intersectsCoordinate([0, -1])).to.be(true);
      });

      it('does not contain points outside the perimeter', function () {
        expect(circle.intersectsCoordinate([2, 0])).to.be(false);
        expect(circle.intersectsCoordinate([1, 1])).to.be(false);
        expect(circle.intersectsCoordinate([-2, 0])).to.be(false);
        expect(circle.intersectsCoordinate([0, -2])).to.be(false);
      });
    });

    describe('#getCenter', function () {
      it('returns the expected value', function () {
        expect(circle.getCenter()).to.eql([0, 0]);
      });
    });

    describe('#getClosestPoint', function () {
      it('returns the closest point on the perimeter', function () {
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

      it('maintains Z coordinates', function () {
        const circle = new Circle([0, 0, 1], 1);
        expect(circle.getLayout()).to.be('XYZ');
        const closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).to.have.length(3);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).to.be(1);
      });

      it('maintains M coordinates', function () {
        const circle = new Circle([0, 0, 2], 1, 'XYM');
        const closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).to.have.length(3);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).to.be(2);
      });

      it('maintains Z and M coordinates', function () {
        const circle = new Circle([0, 0, 1, 2], 1);
        expect(circle.getLayout()).to.be('XYZM');
        const closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).to.have.length(4);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).to.be(1);
        expect(closestPoint[3]).to.be(2);
      });
    });

    describe('#getExtent', function () {
      it('returns the expected value', function () {
        expect(circle.getExtent()).to.eql([-1, -1, 1, 1]);
      });
    });

    describe('#getRadius', function () {
      it('returns the expected value', function () {
        expect(circle.getRadius()).to.be(1);
      });
    });

    describe('#getSimplifiedGeometry', function () {
      it('returns the same geometry', function () {
        expect(circle.getSimplifiedGeometry(1)).to.be(circle);
      });
    });

    describe('#getType', function () {
      it('returns the expected value', function () {
        expect(circle.getType()).to.be('Circle');
      });
    });

    describe('#setCenter', function () {
      it('sets the center', function () {
        circle.setCenter([1, 2]);
        expect(circle.getCenter()).to.eql([1, 2]);
      });

      it('fires a change event', function () {
        const spy = sinon.spy();
        circle.on('change', spy);
        circle.setCenter([1, 2]);
        expect(spy.calledOnce).to.be(true);
      });
    });

    describe('#setFlatCoordinates', function () {
      it('sets both center and radius', function () {
        circle.setFlatCoordinates('XY', [1, 2, 4, 2]);
        expect(circle.getCenter()).to.eql([1, 2]);
        expect(circle.getRadius()).to.be(3);
      });
    });

    describe('#setRadius', function () {
      it('sets the radius', function () {
        circle.setRadius(2);
        expect(circle.getRadius()).to.be(2);
      });

      it('fires a change event', function () {
        const spy = sinon.spy();
        circle.on('change', spy);
        circle.setRadius(2);
        expect(spy.calledOnce).to.be(true);
      });
    });

    describe('#intersectsExtent', function () {
      it('returns false for non-intersecting extents (wide outside own bbox)', function () {
        const wideOutsideLeftTop = [-3, 2, -2, 3];
        const wideOutsideRightTop = [2, 2, 3, 3];
        const wideOutsideRightBottom = [2, -3, 3, -2];
        const wideOutsideLeftBottom = [-3, -3, -2, -2];
        expect(circle.intersectsExtent(wideOutsideLeftTop)).to.be(false);
        expect(circle.intersectsExtent(wideOutsideRightTop)).to.be(false);
        expect(circle.intersectsExtent(wideOutsideRightBottom)).to.be(false);
        expect(circle.intersectsExtent(wideOutsideLeftBottom)).to.be(false);
      });

      it('returns false for non-intersecting extents (inside own bbox)', function () {
        const nearOutsideLeftTop = [-1, 0.9, -0.9, 1];
        const nearOutsideRightTop = [0.9, 0.9, 1, 1];
        const nearOutsideRightBottom = [0.9, -1, 1, -0.9];
        const nearOutsideLeftBottom = [-1, -1, -0.9, -0.9];
        expect(circle.intersectsExtent(nearOutsideLeftTop)).to.be(false);
        expect(circle.intersectsExtent(nearOutsideRightTop)).to.be(false);
        expect(circle.intersectsExtent(nearOutsideRightBottom)).to.be(false);
        expect(circle.intersectsExtent(nearOutsideLeftBottom)).to.be(false);
      });

      it('returns true for extents that intersect clearly', function () {
        const intersectingLeftTop = [-1.5, 0.5, -0.5, 1.5];
        const intersectingRightTop = [0.5, 0.5, 1.5, 1.5];
        const intersectingRightBottom = [0.5, -1.5, 1.5, -0.5];
        const intersectingLeftBottom = [-1.5, -1.5, -0.5, -0.5];
        expect(circle.intersectsExtent(intersectingLeftTop)).to.be(true);
        expect(circle.intersectsExtent(intersectingRightTop)).to.be(true);
        expect(circle.intersectsExtent(intersectingRightBottom)).to.be(true);
        expect(circle.intersectsExtent(intersectingLeftBottom)).to.be(true);
      });

      it('returns true for extents that touch the circumference', function () {
        const touchCircumferenceLeft = [-2, 0, -1, 1];
        const touchCircumferenceTop = [0, 1, 1, 2];
        const touchCircumferenceRight = [1, -1, 2, 0];
        const touchCircumferenceBottom = [-1, -2, 0, -1];
        expect(circle.intersectsExtent(touchCircumferenceLeft)).to.be(true);
        expect(circle.intersectsExtent(touchCircumferenceTop)).to.be(true);
        expect(circle.intersectsExtent(touchCircumferenceRight)).to.be(true);
        expect(circle.intersectsExtent(touchCircumferenceBottom)).to.be(true);
      });

      it('returns true for a contained extent', function () {
        const containedExtent = [-0.5, -0.5, 0.5, 0.5];
        expect(circle.intersectsExtent(containedExtent)).to.be(true);
      });

      it('returns true for a covering extent', function () {
        const bigCoveringExtent = [-5, -5, 5, 5];
        expect(circle.intersectsExtent(bigCoveringExtent)).to.be(true);
      });

      it("returns true for the geom's own extent", function () {
        const circleExtent = circle.getExtent();
        expect(circle.intersectsExtent(circleExtent)).to.be(true);
      });
    });

    describe('#rotate', function () {
      it('rotates the center around the anchor', function () {
        circle.setCenter([1, 0]);
        circle.rotate(Math.PI / 2, [2, 0]);
        expect(circle.getCenter()).to.eql([2, -1]);
        expect(circle.getExtent()).to.eql([1, -2, 3, 0]);
      });

      it('does not change if the anchor equals the center', function () {
        const center = [1, 0];
        circle.setCenter(center);
        const extent = circle.getExtent();
        circle.rotate(Math.PI / 2, center);
        expect(circle.getCenter()).to.eql(center);
        expect(circle.getExtent()).to.eql(extent);
      });
    });

    describe('#translate', function () {
      it('translates the circle', function () {
        circle.setCenter([1, 1]);
        circle.translate(5, 10);
        expect(circle.getCenter()).to.eql([6, 11]);
        expect(circle.getExtent()).to.eql([5, 10, 7, 12]);
      });
    });

    describe('#transform', function () {
      it('transforms between parallel projections', function () {
        const original = new Circle(fromLonLat([16, 48]), 100);
        const transformed = original
          .clone()
          .transform('EPSG:3857', 'EPSG:4326');
        const transformedBack = transformed
          .clone()
          .transform('EPSG:4326', 'EPSG:3857');
        expect(transformedBack.getCenter()[0]).to.roughlyEqual(
          original.getCenter()[0],
          1e-8
        );
        expect(transformedBack.getCenter()[1]).to.roughlyEqual(
          original.getCenter()[1],
          1e-8
        );
        expect(transformedBack.getRadius()).to.roughlyEqual(
          original.getRadius(),
          1e-9
        );
        expect(transformed.getFlatCoordinates()[3]).to.equal(
          transformed.getFlatCoordinates()[1]
        );
        expect(transformedBack.getFlatCoordinates()[3]).to.equal(
          transformedBack.getFlatCoordinates()[1]
        );
      });

      it('transforms between non-parallel and parallel projections', function () {
        proj4.defs(
          'EPSG:32632',
          '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs'
        );
        register(proj4);
        const original = new Circle(fromLonLat([16, 48], 'EPSG:32632'), 100);
        const transformed = original
          .clone()
          .transform('EPSG:32632', 'EPSG:4326');
        const transformedBack = transformed
          .clone()
          .transform('EPSG:4326', 'EPSG:32632');
        expect(transformedBack.getCenter()[0]).to.roughlyEqual(
          original.getCenter()[0],
          1e-8
        );
        expect(transformedBack.getCenter()[1]).to.roughlyEqual(
          original.getCenter()[1],
          1e-8
        );
        expect(transformedBack.getRadius()).to.roughlyEqual(
          original.getRadius(),
          1e-9
        );
        expect(transformed.getFlatCoordinates()[3]).to.equal(
          transformed.getFlatCoordinates()[1]
        );
        expect(transformedBack.getFlatCoordinates()[3]).to.equal(
          transformedBack.getFlatCoordinates()[1]
        );
      });
    });
  });
});
