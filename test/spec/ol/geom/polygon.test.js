goog.provide('ol.test.geom.Polygon');


describe('ol.geom.Polygon', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var polygon = new ol.geom.Polygon(null);
      polygon = polygon; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct empty', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon([]);
    });

    it('defaults to layout XY', function() {
      expect(polygon.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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

    it('can append linear rings', function() {
      polygon.appendLinearRing(
          new ol.geom.LinearRing([[1, 2], [3, 4], [5, 6]]));
      expect(polygon.getCoordinates()).to.eql(
          [[[1, 2], [3, 4], [5, 6]]]);
      polygon.appendLinearRing(
          new ol.geom.LinearRing([[7, 8], [9, 10], [11, 12]]));
      expect(polygon.getCoordinates()).to.eql(
          [[[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10], [11, 12]]]);
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
      expect(polygon.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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

    it('can return individual rings', function() {
      expect(polygon.getLinearRing(0).getCoordinates()).to.eql(outerRing);
      expect(polygon.getLinearRing(1).getCoordinates()).to.eql(innerRing);
    });

    it('has the expected rings', function() {
      var linearRings = polygon.getLinearRings();
      expect(linearRings).to.be.an(Array);
      expect(linearRings).to.have.length(2);
      expect(linearRings[0]).to.be.an(ol.geom.LinearRing);
      expect(linearRings[0].getCoordinates()).to.eql(outerRing);
      expect(linearRings[1]).to.be.an(ol.geom.LinearRing);
      expect(linearRings[1].getCoordinates()).to.eql(innerRing);
    });

    it('does not reverse any rings', function() {
      outerRing.reverse();
      innerRing.reverse();
      polygon = new ol.geom.Polygon([outerRing, innerRing]);
      var coordinates = polygon.getCoordinates();
      expect(coordinates[0]).to.eql(outerRing);
      expect(coordinates[1]).to.eql(innerRing);
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

    describe('#getOrientedFlatCoordinates', function() {

      it('reverses the outer ring if necessary', function() {
        outerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses inner rings if necessary', function() {
        innerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses all rings if necessary', function() {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

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
      expect(polygon.getLayout()).to.be(ol.geom.GeometryLayout.XYZ);
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

    it('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner)).to.be(false);
    });

    describe('#getOrientedFlatCoordinates', function() {

      it('reverses the outer ring if necessary', function() {
        outerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses inner rings if necessary', function() {
        innerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses all rings if necessary', function() {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

    });

  });

  describe('construct with 3D coordinates and layout XYM', function() {

    var outerRing, innerRing, polygon, flatCoordinates;
    var outsideOuter, inside, insideInner;
    beforeEach(function() {
      outerRing = [[0, 0, 1], [4, 4, 2], [4, 0, 3]];
      innerRing = [[2, 1, 4], [3, 1, 5], [3, 2, 6]];
      polygon = new ol.geom.Polygon(
          [outerRing, innerRing], ol.geom.GeometryLayout.XYM);
      flatCoordinates = [0, 0, 1, 4, 4, 2, 4, 0, 3, 2, 1, 4, 3, 1, 5, 3, 2, 6];
      outsideOuter = [1, 3];
      inside = [3.5, 0.5];
      insideInner = [2.9, 1.1];
    });

    it('has the expected layout', function() {
      expect(polygon.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
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

    it('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner)).to.be(false);
    });

    describe('#getOrientedFlatCoordinates', function() {

      it('reverses the outer ring if necessary', function() {
        outerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses inner rings if necessary', function() {
        innerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses all rings if necessary', function() {
        outerRing.reverse();
        innerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

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
      expect(polygon.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
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

    it('does not contain outside coordinates', function() {
      expect(polygon.containsCoordinate(outsideOuter)).to.be(false);
    });

    it('does contain inside coordinates', function() {
      expect(polygon.containsCoordinate(inside)).to.be(true);
    });

    it('does not contain inside inner coordinates', function() {
      expect(polygon.containsCoordinate(insideInner1)).to.be(false);
      expect(polygon.containsCoordinate(insideInner2)).to.be(false);
    });

    describe('#getOrientedFlatCoordinates', function() {

      it('reverses the outer ring if necessary', function() {
        outerRing.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing1, innerRing2]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses inner rings if necessary', function() {
        innerRing1.reverse();
        innerRing2.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing1, innerRing2]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

      it('reverses all rings if necessary', function() {
        outerRing.reverse();
        innerRing1.reverse();
        innerRing2.reverse();
        polygon = new ol.geom.Polygon([outerRing, innerRing1, innerRing2]);
        expect(polygon.getOrientedFlatCoordinates()).to.eql(flatCoordinates);
      });

    });

  });

  describe('with a simple polygon', function() {

    var polygon;
    beforeEach(function() {
      polygon = new ol.geom.Polygon(
          [[[3, 0], [1, 3], [0, 6], [2, 6], [3, 7], [4, 6], [6, 6], [4, 3]]]);
    });

    describe('#getSimplifiedGeometry', function() {

      it('returns the expected result', function() {
        var simplifiedGeometry = polygon.getSimplifiedGeometry(9);
        expect(simplifiedGeometry).to.be.an(ol.geom.Polygon);
        expect(simplifiedGeometry.getCoordinates()).to.eql(
            [[[3, 0], [0, 3], [0, 6], [6, 6], [3, 3]]]);
      });

      it('caches multiple simplified geometries', function() {
        var simplifiedGeometry1 = polygon.getSimplifiedGeometry(4);
        var simplifiedGeometry2 = polygon.getSimplifiedGeometry(9);
        var simplifiedGeometry3 = polygon.getSimplifiedGeometry(4);
        var simplifiedGeometry4 = polygon.getSimplifiedGeometry(9);
        expect(simplifiedGeometry1).to.be(simplifiedGeometry3);
        expect(simplifiedGeometry2).to.be(simplifiedGeometry4);
      });

    });
  });

});


goog.require('ol.extent');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.Polygon');
