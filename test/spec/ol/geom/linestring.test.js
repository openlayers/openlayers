goog.provide('ol.test.geom.LineString');


describe('ol.geom.LineString', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var lineString = new ol.geom.LineString(null);
      lineString = lineString; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct empty', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString([]);
    });

    it('defaults to layout XY', function() {
      expect(lineString.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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
      expect(lineString.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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
      expect(lineString.getLayout()).to.be(ol.geom.GeometryLayout.XYZ);
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
          [[1, 2, 3], [4, 5, 6]], ol.geom.GeometryLayout.XYM);
    });

    it('has the expected layout', function() {
      expect(lineString.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
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
      expect(lineString.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
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

  describe('with a simple line string', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString(
          [[0, 0], [1.5, 1], [3, 3], [5, 1], [6, 3.5], [7, 5]]);
    });

    describe('#getSimplifiedGeometry', function() {

      it('returns the expectedResult', function() {
        var simplifiedGeometry = lineString.getSimplifiedGeometry(1);
        expect(simplifiedGeometry).to.be.an(ol.geom.LineString);
        expect(simplifiedGeometry.getCoordinates()).to.eql(
            [[0, 0], [3, 3], [5, 1], [7, 5]]);
      });

      it('caches by resolution', function() {
        var simplifiedGeometry1 = lineString.getSimplifiedGeometry(1);
        var simplifiedGeometry2 = lineString.getSimplifiedGeometry(1);
        expect(simplifiedGeometry1).to.be(simplifiedGeometry2);
      });

      it('invalidates the cache when the geometry changes', function() {
        var simplifiedGeometry1 = lineString.getSimplifiedGeometry(1);
        lineString.setCoordinates(lineString.getCoordinates());
        var simplifiedGeometry2 = lineString.getSimplifiedGeometry(1);
        expect(simplifiedGeometry1).not.to.be(simplifiedGeometry2);
      });

      it('remembers the minimum squared tolerance', function() {
        sinon.spy(lineString, 'getSimplifiedGeometryInternal');
        var simplifiedGeometry1 = lineString.getSimplifiedGeometry(0.05);
        expect(lineString.getSimplifiedGeometryInternal.callCount).to.be(1);
        expect(simplifiedGeometry1).to.be(lineString);
        var simplifiedGeometry2 = lineString.getSimplifiedGeometry(0.01);
        expect(lineString.getSimplifiedGeometryInternal.callCount).to.be(1);
        expect(simplifiedGeometry2).to.be(lineString);
      });

    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.LineString');
