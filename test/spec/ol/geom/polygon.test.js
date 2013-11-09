goog.provide('ol.test.geom.Polygon');


describe('ol.geom.Polygon', function() {

  describe('construct empty', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon([]);
    });

    it('defaults to layout XY', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has empty coordinates', function() {
      expect(polygon.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function() {
      expect(ol.extent.isEmpty(polygon.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(2);
    });

  });

  describe('construct with 2D coordinates', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql(
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([1, 2, 7, 8]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(2);
    });

  });

  describe('construct with 3D coordinates', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XYZ);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]],
          ol.geom.Layout.XYM);
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XYM);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(3);
    });

  });

  describe('construct with 4D coordinates', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon(
          [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XYZM);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql(
          [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([1, 2, 13, 14]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(4);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.Polygon');
