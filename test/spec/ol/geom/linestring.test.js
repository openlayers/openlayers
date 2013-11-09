goog.provide('ol.test.geom.LineString');


describe('ol.geom.LineString', function() {

  describe('construct empty', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString([]);
    });

    it('defaults to layout XY', function() {
      expect(lineString.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has empty coordinates', function() {
      expect(lineString.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function() {
      expect(ol.extent.isEmpty(lineString.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function() {
      expect(lineString.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function() {
      expect(lineString.getStride()).to.be(2);
    });

  });

  describe('construct with 2D coordinates', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString([[1, 2], [3, 4]]);
    });

    it('has the expected layout', function() {
      expect(lineString.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has the expected coordinates', function() {
      expect(lineString.getCoordinates()).to.eql([[1, 2], [3, 4]]);
    });

    it('has the expected extent', function() {
      expect(lineString.getExtent()).to.eql([1, 2, 3, 4]);
    });

    it('has the expected flat coordinates', function() {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4]);
    });

    it('has stride the expected stride', function() {
      expect(lineString.getStride()).to.be(2);
    });

  });

  describe('construct with 3D coordinates', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString([[1, 2, 3], [4, 5, 6]]);
    });

    it('has the expected layout', function() {
      expect(lineString.getLayout()).to.be(ol.geom.Layout.XYZ);
    });

    it('has the expected coordinates', function() {
      expect(lineString.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
    });

    it('has the expected extent', function() {
      expect(lineString.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function() {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function() {
      expect(lineString.getStride()).to.be(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString(
          [[1, 2, 3], [4, 5, 6]], ol.geom.Layout.XYM);
    });

    it('has the expected layout', function() {
      expect(lineString.getLayout()).to.be(ol.geom.Layout.XYM);
    });

    it('has the expected coordinates', function() {
      expect(lineString.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
    });

    it('has the expected extent', function() {
      expect(lineString.getExtent()).to.eql([1, 2, 4, 5]);
    });

    it('has the expected flat coordinates', function() {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6]);
    });

    it('has the expected stride', function() {
      expect(lineString.getStride()).to.be(3);
    });

  });

  describe('construct with 4D coordinates', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    it('has the expected layout', function() {
      expect(lineString.getLayout()).to.be(ol.geom.Layout.XYZM);
    });

    it('has the expected coordinates', function() {
      expect(lineString.getCoordinates()).to.eql([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    it('has the expected extent', function() {
      expect(lineString.getExtent()).to.eql([1, 2, 5, 6]);
    });

    it('has the expected flat coordinates', function() {
      expect(lineString.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has the expected stride', function() {
      expect(lineString.getStride()).to.be(4);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.LineString');
