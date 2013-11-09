goog.provide('ol.test.geom.MultiLineString');


describe('ol.geom.MultiLineString', function() {

  describe('construct empty', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString([]);
    });

    it('defaults to layout XY', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has empty coordinates', function() {
      expect(multiLineString.getCoordinates()).to.be.empty();
    });

    it('has an empty extent', function() {
      expect(ol.extent.isEmpty(multiLineString.getExtent())).to.be(true);
    });

    it('has empty flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.be.empty();
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(2);
    });

  });

  describe('construct with 2D coordinates', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 7, 8]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(2);
    });

  });

  describe('construct with 3D coordinates', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.Layout.XYZ);
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(3);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]],
          ol.geom.Layout.XYM);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.Layout.XYM);
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 10, 11]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(3);
    });

  });

  describe('construct with 4D coordinates', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString(
          [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.Layout.XYZM);
    });

    it('has the expected coordinates', function() {
      expect(multiLineString.getCoordinates()).to.eql(
          [[[1, 2, 3, 4], [5, 6, 7, 8]], [[9, 10, 11, 12], [13, 14, 15, 16]]]);
    });

    it('has the expected extent', function() {
      expect(multiLineString.getExtent()).to.eql([1, 2, 13, 14]);
    });

    it('has the expected flat coordinates', function() {
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    });

    it('has stride the expected stride', function() {
      expect(multiLineString.getStride()).to.be(4);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.MultiLineString');
