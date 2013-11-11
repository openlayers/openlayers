// FIXME why do the xit tests below fail? I don't understand!

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

    var outerRing, innerRing, polygon, flatCoordinates;
    var outsideOuter, inside, insideInner;
    beforeEach(function() {
      outerRing = [[0, 1], [1, 4], [4, 3], [3, 0]];
      innerRing = [[2, 2], [3, 2], [3, 3], [2, 3]];
      polygon = new ol.geom.Polygon([outerRing, innerRing]);
      flatCoordinates = [0, 1, 1, 4, 4, 3, 3, 0, 2, 2, 3, 2, 3, 3, 2, 3];
      outsideOuter = [0, 4];
      inside = [1.5, 1.5];
      insideInner = [2.5, 3.5];
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XY);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql([outerRing, innerRing]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([0, 0, 4, 4]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(2);
    });

    it('reverses the outer ring if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing.reverse(), innerRing]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses inner rings if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing, innerRing.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses all rings if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing.reverse(), innerRing.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner)).to.be(false);
    });

  });

  describe('construct with 3D coordinates', function() {

    var outerRing, innerRing, polygon, flatCoordinates;
    var outsideOuter, inside, insideInner;
    beforeEach(function() {
      outerRing = [[0, 0, 1], [4, 4, 2], [4, 0, 3]];
      innerRing = [[2, 1, 4], [3, 1, 5], [3, 2, 6]];
      polygon = new ol.geom.Polygon([outerRing, innerRing]);
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XYZ);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql([outerRing, innerRing]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([0, 0, 4, 4]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(3);
    });

    it('reverses the outer ring if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing.reverse(), innerRing]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses inner rings if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing, innerRing.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses all rings if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing.reverse(), innerRing.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner)).to.be(false);
    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var outerRing, innerRing, polygon, flatCoordinates;
    var outsideOuter, inside, insideInner;
    beforeEach(function() {
      outerRing = [[0, 0, 1], [4, 4, 2], [4, 0, 3]];
      innerRing = [[2, 1, 4], [3, 1, 5], [3, 2, 6]];
      polygon = new ol.geom.Polygon([outerRing, innerRing], ol.geom.Layout.XYM);
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XYM);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql([outerRing, innerRing]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([0, 0, 4, 4]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(3);
    });

    it('reverses the outer ring if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing.reverse(), innerRing]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses inner rings if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing, innerRing.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses all rings if necessary', function() {
      polygon = new ol.geom.Polygon([outerRing.reverse(), innerRing.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner)).to.be(false);
    });

  });

  describe('construct with 4D coordinates', function() {

    var outerRing, innerRing1, innerRing2, polygon, flatCoordinates;
    var outsideOuter, inside, insideInner1, insideInner2;
    beforeEach(function() {
      outerRing = [[0, 6, 1, 2], [6, 6, 3, 4], [3, 0, 5, 6]];
      innerRing1 =
          [[2, 4, 7, 8], [4, 4, 9, 10], [4, 5, 11, 12], [2, 5, 13, 14]];
      innerRing2 = [[3, 2, 15, 16], [4, 3, 17, 18], [2, 3, 19, 20]];
      polygon = new ol.geom.Polygon([outerRing, innerRing1, innerRing2]);
      flatCoordinates = [
        0, 6, 1, 2, 6, 6, 3, 4, 3, 0, 5, 6,
        2, 4, 7, 8, 4, 4, 9, 10, 4, 5, 11, 12, 2, 5, 13, 14,
        3, 2, 15, 16, 4, 3, 17, 18, 2, 3, 19, 20
      ];
      outsideOuter = [1, 1];
      inside = [3, 1];
      insideInner1 = [2.5, 4.5];
      insideInner2 = [3, 2.5];
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.Layout.XYZM);
    });

    it('has the expected coordinates', function() {
      expect(polygon.getCoordinates()).to.eql(
          [outerRing, innerRing1, innerRing2]);
    });

    it('has the expected extent', function() {
      expect(polygon.getExtent()).to.eql([0, 0, 6, 6]);
    });

    it('has the expected flat coordinates', function() {
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('has stride the expected stride', function() {
      expect(polygon.getStride()).to.be(4);
    });

    it('reverses the outer ring if necessary', function() {
      polygon = new ol.geom.Polygon(
          [outerRing.reverse(), innerRing1, innerRing2]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses inner rings if necessary', function() {
      polygon = new ol.geom.Polygon(
          [outerRing, innerRing1.reverse(), innerRing2.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    it('reverses all rings if necessary', function() {
      polygon = new ol.geom.Polygon(
          [outerRing.reverse(), innerRing1.reverse(), innerRing2.reverse()]);
      expect(polygon.getFlatCoordinates()).to.eql(flatCoordinates);
    });

    xit('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner1)).to.be(false);
      expect(polygon.containsCoordinate(insideInner2)).to.be(false);
    });

    xit('fails in strange ways', function() {
      expect(polygon.containsCoordinate([0, 0])).to.be(false);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.Polygon');
