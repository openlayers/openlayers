goog.provide('ol.test.geom.Circle');


describe('ol.geom.Circle', function() {

  describe('with a unit circle', function() {

    var circle;
    beforeEach(function() {
      circle = new ol.geom.Circle([0, 0], 1);
    });

    describe('#clone', function() {

      it('returns a clone', function() {
        var clone = circle.clone();
        expect(clone).to.be.an(ol.geom.Circle);
        expect(clone.getCenter()).to.eql(circle.getCenter());
        expect(clone.getCenter()).not.to.be(circle.getCenter());
        expect(clone.getRadius()).to.be(circle.getRadius());
      });

    });

    describe('#containsCoordinate', function() {

      it('contains the center', function() {
        expect(circle.containsCoordinate([0, 0])).to.be(true);
      });

      it('contains points inside the perimeter', function() {
        expect(circle.containsCoordinate([0.5, 0.5])).to.be(true);
        expect(circle.containsCoordinate([-0.5, 0.5])).to.be(true);
        expect(circle.containsCoordinate([-0.5, -0.5])).to.be(true);
        expect(circle.containsCoordinate([0.5, -0.5])).to.be(true);
      });

      it('contains points on the perimeter', function() {
        expect(circle.containsCoordinate([1, 0])).to.be(true);
        expect(circle.containsCoordinate([0, 1])).to.be(true);
        expect(circle.containsCoordinate([-1, 0])).to.be(true);
        expect(circle.containsCoordinate([0, -1])).to.be(true);
      });

      it('does not contain points outside the perimeter', function() {
        expect(circle.containsCoordinate([2, 0])).to.be(false);
        expect(circle.containsCoordinate([1, 1])).to.be(false);
        expect(circle.containsCoordinate([-2, 0])).to.be(false);
        expect(circle.containsCoordinate([0, -2])).to.be(false);
      });

    });

    describe('#getCenter', function() {

      it('returns the expected value', function() {
        expect(circle.getCenter()).to.eql([0, 0]);
      });

    });

    describe('#getClosestPoint', function() {

      it('returns the closest point on the perimeter', function() {
        var closestPoint;
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

      it('maintains Z coordinates', function() {
        var circle = new ol.geom.Circle([0, 0, 1], 1);
        expect(circle.getLayout()).to.be(ol.geom.GeometryLayout.XYZ);
        var closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).to.have.length(3);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).to.be(1);
      });

      it('maintains M coordinates', function() {
        var circle = new ol.geom.Circle([0, 0, 2], 1,
            ol.geom.GeometryLayout.XYM);
        var closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).to.have.length(3);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).to.be(2);
      });

      it('maintains Z and M coordinates', function() {
        var circle = new ol.geom.Circle([0, 0, 1, 2], 1);
        expect(circle.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
        var closestPoint = circle.getClosestPoint([2, 0]);
        expect(closestPoint).to.have.length(4);
        expect(closestPoint[0]).to.roughlyEqual(1, 1e-15);
        expect(closestPoint[1]).to.roughlyEqual(0, 1e-15);
        expect(closestPoint[2]).to.be(1);
        expect(closestPoint[3]).to.be(2);
      });

    });

    describe('#getExtent', function() {

      it('returns the expected value', function() {
        expect(circle.getExtent()).to.eql([-1, -1, 1, 1]);
      });

    });

    describe('#getRadius', function() {

      it('returns the expected value', function() {
        expect(circle.getRadius()).to.be(1);
      });

    });

    describe('#getSimplifiedGeometry', function() {

      it('returns the same geometry', function() {
        expect(circle.getSimplifiedGeometry(1)).to.be(circle);
      });

    });

    describe('#getType', function() {

      it('returns the expected value', function() {
        expect(circle.getType()).to.be(ol.geom.GeometryType.CIRCLE);
      });

    });

    describe('#setCenter', function() {

      it('sets the center', function() {
        circle.setCenter([1, 2]);
        expect(circle.getCenter()).to.eql([1, 2]);
      });

      it('fires a change event', function() {
        var spy = sinon.spy();
        circle.on('change', spy);
        circle.setCenter([1, 2]);
        expect(spy.calledOnce).to.be(true);
      });

    });

    describe('#setFlatCoordinates', function() {

      it('sets both center and radius', function() {
        circle.setFlatCoordinates(ol.geom.GeometryLayout.XY, [1, 2, 4, 2]);
        expect(circle.getCenter()).to.eql([1, 2]);
        expect(circle.getRadius()).to.be(3);
      });

      it('fires a single change event', function() {
        var spy = sinon.spy();
        circle.on('change', spy);
        circle.setFlatCoordinates(ol.geom.GeometryLayout.XY, [1, 2, 4, 2]);
        expect(spy.calledOnce).to.be(true);
      });

    });

    describe('#setRadius', function() {

      it('sets the radius', function() {
        circle.setRadius(2);
        expect(circle.getRadius()).to.be(2);
      });

      it('fires a change event', function() {
        var spy = sinon.spy();
        circle.on('change', spy);
        circle.setRadius(2);
        expect(spy.calledOnce).to.be(true);
      });

    });

  });

});


goog.require('ol.geom.Circle');
goog.require('ol.geom.GeometryType');
