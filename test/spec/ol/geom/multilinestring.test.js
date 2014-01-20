goog.provide('ol.test.geom.MultiLineString');


describe('ol.geom.MultiLineString', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var multiLineString = new ol.geom.MultiLineString(null);
      multiLineString = multiLineString; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct empty', function() {

    var multiLineString;
    beforeEach(function() {
      multiLineString = new ol.geom.MultiLineString([]);
    });

    it('defaults to layout XY', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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
      expect(multiLineString.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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
      expect(multiLineString.getLayout()).to.be(ol.geom.GeometryLayout.XYZ);
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
          ol.geom.GeometryLayout.XYM);
    });

    it('has the expected layout', function() {
      expect(multiLineString.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
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
      expect(multiLineString.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
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

  describe('#setLineStrings', function() {

    it('sets the line strings', function() {
      var multiLineString = new ol.geom.MultiLineString(null);
      var lineString1 = new ol.geom.LineString([[1, 2], [3, 4]]);
      var lineString2 = new ol.geom.LineString([[5, 6], [7, 8]]);
      multiLineString.setLineStrings([lineString1, lineString2]);
      expect(multiLineString.getFlatCoordinates()).to.eql(
          [1, 2, 3, 4, 5, 6, 7, 8]);
      expect(multiLineString.getEnds()).to.eql([4, 8]);
      var coordinates = multiLineString.getCoordinates();
      expect(coordinates[0]).to.eql(lineString1.getCoordinates());
      expect(coordinates[1]).to.eql(lineString2.getCoordinates());
    });
  });

});


goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
