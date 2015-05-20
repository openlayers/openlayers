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

    it('can append coordinates', function() {
      lineString.appendCoordinate([1, 2]);
      expect(lineString.getCoordinates()).to.eql([[1, 2]]);
      lineString.appendCoordinate([3, 4]);
      expect(lineString.getCoordinates()).to.eql([[1, 2], [3, 4]]);
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

    describe('#getFirstCoordinate', function() {

      it('returns the expected result', function() {
        expect(lineString.getFirstCoordinate()).to.eql([0, 0]);
      });

    });

    describe('#getFlatMidpoint', function() {

      it('returns the expected result', function() {
        var midpoint = lineString.getFlatMidpoint();
        expect(midpoint).to.be.an(Array);
        expect(midpoint).to.have.length(2);
        expect(midpoint[0]).to.roughlyEqual(4, 1e-1);
        expect(midpoint[1]).to.roughlyEqual(2, 1e-1);
      });

    });

    describe('#getLastCoordinate', function() {

      it('returns the expected result', function() {
        expect(lineString.getLastCoordinate()).to.eql([7, 5]);
      });

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

  describe('with a simple XYM coordinates', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString(
          [[1, 2, 3], [4, 5, 6]], ol.geom.GeometryLayout.XYM);
    });

    describe('#getCoordinateAtM', function() {

      it('returns the expected value', function() {
        expect(lineString.getCoordinateAtM(2, false)).to.be(null);
        expect(lineString.getCoordinateAtM(2, true)).to.eql([1, 2, 2]);
        expect(lineString.getCoordinateAtM(3, false)).to.eql([1, 2, 3]);
        expect(lineString.getCoordinateAtM(3, true)).to.eql([1, 2, 3]);
        expect(lineString.getCoordinateAtM(4, false)).to.eql([2, 3, 4]);
        expect(lineString.getCoordinateAtM(4, true)).to.eql([2, 3, 4]);
        expect(lineString.getCoordinateAtM(5, false)).to.eql([3, 4, 5]);
        expect(lineString.getCoordinateAtM(5, true)).to.eql([3, 4, 5]);
        expect(lineString.getCoordinateAtM(6, false)).to.eql([4, 5, 6]);
        expect(lineString.getCoordinateAtM(6, true)).to.eql([4, 5, 6]);
        expect(lineString.getCoordinateAtM(7, false)).to.eql(null);
        expect(lineString.getCoordinateAtM(7, true)).to.eql([4, 5, 7]);
      });

    });

  });

  describe('with several XYZM coordinates', function() {

    var lineString;
    beforeEach(function() {
      lineString = new ol.geom.LineString([
        [0, 0, 0, 0],
        [1, -1, 2, 1],
        [2, -2, 4, 2],
        [4, -4, 8, 4],
        [8, -8, 16, 8],
        [12, -12, 24, 12],
        [14, -14, 28, 14],
        [15, -15, 30, 15],
        [16, -16, 32, 16],
        [18, -18, 36, 18],
        [22, -22, 44, 22]
      ]);
    });

    describe('#getCoordinateAtM', function() {

      it('returns the expected value', function() {
        expect(lineString.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
        var m;
        for (m = 0; m <= 22; m += 0.5) {
          expect(lineString.getCoordinateAtM(m, true)).to.eql(
              [m, -m, 2 * m, m]);
        }
      });

    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.LineString');
