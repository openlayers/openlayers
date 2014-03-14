goog.provide('ol.test.geom.MultiPoint');


describe('ol.geom.MultiPoint', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var multiPoint = new ol.geom.MultiPoint(null);
      multiPoint = multiPoint; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct empty', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([]);
    });

    it('defaults to layout XY', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XY);
    });

    it('has empty coordinates', function() {
      expect(multiPoint.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function() {
      expect(ol.extent.isEmpty(multiPoint.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function() {
      expect(multiPoint.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function() {
      expect(multiPoint.getStride()).to.be(2);
    });

    it('can append points', function() {
      multiPoint.appendPoint(new ol.geom.Point([1, 2]));
      expect(multiPoint.getCoordinates()).to.eql([[1, 2]]);
      multiPoint.appendPoint(new ol.geom.Point([3, 4]));
      expect(multiPoint.getCoordinates()).to.eql([[1, 2], [3, 4]]);
    });

  });

  describe('construct with 2D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2], [3, 4]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XY);
    });

    it('has the expected coordinates', function() {
      expect(multiPoint.getCoordinates()).to.eql([[1, 2], [3, 4]]);
    });

    it('has the expected extent', function() {
      expect(multiPoint.getExtent()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has stride the expected stride', function() {
      expect(multiPoint.getStride()).to.be(2);
    });

  });

  describe('construct with 3D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2, 3], [4, 5, 6]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XYZ);
    });

    it('has the expected coordinates', function() {
      expect(multiPoint.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
    });

    it('has the expected extent', function() {
      expect(multiPoint.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function() {
      expect(multiPoint.getStride()).to.be(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint(
          [[1, 2, 3], [4, 5, 6]], ol.geom.GeometryLayout.XYM);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
    });

    it('has the expected coordinates', function() {
      expect(multiPoint.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
    });

    it('has the expected extent', function() {
      expect(multiPoint.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function() {
      expect(multiPoint.getStride()).to.be(3);
    });

    it('can return individual points', function() {
      var point0 = multiPoint.getPoint(0);
      expect(point0.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(point0.getCoordinates()).to.eql([1, 2, 3]);
      var point1 = multiPoint.getPoint(1);
      expect(point1.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(point1.getCoordinates()).to.eql([4, 5, 6]);
    });

    it('can return all points', function() {
      var points = multiPoint.getPoints();
      expect(points).to.have.length(2);
      expect(points[0]).to.be.an(ol.geom.Point);
      expect(points[0].getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(points[0].getCoordinates()).to.eql([1, 2, 3]);
      expect(points[1]).to.be.an(ol.geom.Point);
      expect(points[1].getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(points[1].getCoordinates()).to.eql([4, 5, 6]);
    });

  });

  describe('construct with 4D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
    });

    it('has the expected coordinates', function() {
      expect(multiPoint.getCoordinates()).to.eql([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    it('has the expected extent', function() {
      expect(multiPoint.getExtent()).to.eql([1, 2, 5, 6]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiPoint.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has the expected stride', function() {
      expect(multiPoint.getStride()).to.be(4);
    });

    describe('#getClosestPoint', function() {

      it('preserves extra dimensions', function() {
        var closestPoint = multiPoint.getClosestPoint([6, 6]);
        expect(closestPoint).to.eql([5, 6, 7, 8]);
      });

    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
