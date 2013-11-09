goog.provide('ol.test.geom.MultiPoint');


describe('ol.geom.MultiPoint', function() {

  describe('construct empty', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([]);
    });

    it('defaults to layout XY', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.Layout.XY);
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

  });

  describe('construct with 2D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2], [3, 4]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.Layout.XY);
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
      expect(multiPoint.getLayout()).to.be(ol.geom.Layout.XYZ);
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
          [[1, 2, 3], [4, 5, 6]], ol.geom.Layout.XYM);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.Layout.XYM);
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

  describe('construct with 4D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.Layout.XYZM);
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

  });

});


goog.require('ol.extent');
goog.require('ol.geom.MultiPoint');
