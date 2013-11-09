goog.provide('ol.test.geom.Point');


describe('ol.geom.Point', function() {

  describe('construct with 2D coordinates', function() {

    var point;
    beforeEach(function() {
      point = new ol.geom.Point([1, 2]);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.Layout.XY);
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
      point = new ol.geom.Point([1, 2, 3], ol.geom.Layout.XYM);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.Layout.XYM);
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
      expect(point.getLayout()).to.be(ol.geom.Layout.XYZM);
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

  });

});


goog.require('ol.extent');
goog.require('ol.geom.Point');
