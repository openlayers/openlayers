goog.provide('ol.test.geom.Point');


describe('ol.geom.Point', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var point = new ol.geom.Point(null);
      point = point; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct with 2D coordinates', function() {

    var point;
    beforeEach(function() {
      point = new ol.geom.Point([1, 2]);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.GeometryLayout.XY);
    });

    it('has the expected coordinates', function() {
      expect(point.getCoordinates()).to.eql([1, 2]);
    });

    it('has the expected extent', function() {
      expect(point.getExtent()).to.eql([1, 2, 1, 2]);
    });

    it('has the expected flat coordinates', function() {
      expect(point.getFlatCoordinates()).to.eql([1, 2]);
    });

    it('has stride the expected stride', function() {
      expect(point.getStride()).to.be(2);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var point;
    beforeEach(function() {
      point = new ol.geom.Point([1, 2, 3], ol.geom.GeometryLayout.XYM);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
    });

    it('has the expected coordinates', function() {
      expect(point.getCoordinates()).to.eql([1, 2, 3]);
    });

    it('has the expected extent', function() {
      expect(point.getExtent()).to.eql([1, 2, 1, 2]);
    });

    it('has the expected flat coordinates', function() {
      expect(point.getFlatCoordinates()).to.eql([1, 2, 3]);
    });

    it('has the expected stride', function() {
      expect(point.getStride()).to.be(3);
    });

  });

  describe('construct with 4D coordinates', function() {

    var point;
    beforeEach(function() {
      point = new ol.geom.Point([1, 2, 3, 4]);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
    });

    it('has the expected coordinates', function() {
      expect(point.getCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected extent', function() {
      expect(point.getExtent()).to.eql([1, 2, 1, 2]);
    });

    it('has the expected flat coordinates', function() {
      expect(point.getFlatCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected stride', function() {
      expect(point.getStride()).to.be(4);
    });

    describe('#getClosestPoint', function() {

      it('preseves extra dimensions', function() {
        var closestPoint = point.getClosestPoint([0, 0]);
        expect(closestPoint).to.eql([1, 2, 3, 4]);
      });

    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.Point');
