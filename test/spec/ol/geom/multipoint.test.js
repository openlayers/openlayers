goog.provide('ol.test.geom.MultiPoint');


describe('ol.geom.MultiPoint', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var multiPoint = new ol.geom.MultiPoint(null);
      multiPoint = multiPoint; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct empty', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([]);
    });

    it('defaults to layout XY', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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

    it('can append points', function() {
      multiPoint.appendPoint(new ol.geom.Point([1, 2]));
      expect(multiPoint.getCoordinates()).to.eql([[1, 2]]);
      multiPoint.appendPoint(new ol.geom.Point([3, 4]));
      expect(multiPoint.getCoordinates()).to.eql([[1, 2], [3, 4]]);
    });

  });

  describe('construct with 2D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2], [3, 4]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XYZ);
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
          [[1, 2, 3], [4, 5, 6]], ol.geom.GeometryLayout.XYM);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
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

    it('can return individual points', function() {
      var point0 = multiPoint.getPoint(0);
      expect(point0.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(point0.getCoordinates()).to.eql([1, 2, 3]);
      var point1 = multiPoint.getPoint(1);
      expect(point1.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(point1.getCoordinates()).to.eql([4, 5, 6]);
    });

    it('can return all points', function() {
      var points = multiPoint.getPoints();
      expect(points).to.have.length(2);
      expect(points[0]).to.be.an(ol.geom.Point);
      expect(points[0].getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(points[0].getCoordinates()).to.eql([1, 2, 3]);
      expect(points[1]).to.be.an(ol.geom.Point);
      expect(points[1].getLayout()).to.be(ol.geom.GeometryLayout.XYM);
      expect(points[1].getCoordinates()).to.eql([4, 5, 6]);
    });

  });

  describe('construct with 4D coordinates', function() {

    var multiPoint;
    beforeEach(function() {
      multiPoint = new ol.geom.MultiPoint([[1, 2, 3, 4], [5, 6, 7, 8]]);
    });

    it('has the expected layout', function() {
      expect(multiPoint.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
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

    describe('#getClosestPoint', function() {

      it('preserves extra dimensions', function() {
        var closestPoint = multiPoint.getClosestPoint([6, 6]);
        expect(closestPoint).to.eql([5, 6, 7, 8]);
      });

    });

  });

  describe('#applyTransform()', function() {

    var multi, transform;
    beforeEach(function() {
      multi = new ol.geom.MultiPoint([[1, 2], [3, 4]]);
      transform = sinon.spy();
    });

    it('calls a transform function', function() {
      multi.applyTransform(transform);
      expect(transform.calledOnce).to.be(true);
      var args = transform.firstCall.args;
      expect(args).to.have.length(3);

      expect(args[0]).to.be(multi.getFlatCoordinates()); // input coords
      expect(args[1]).to.be(multi.getFlatCoordinates()); // output coords
      expect(args[2]).to.be(2); // dimension
    });

    it('allows for modification of coordinates', function() {
      var mod = function(input, output, dimension) {
        var copy = input.slice();
        for (var i = 0, ii = copy.length; i < ii; i += dimension) {
          output[i] = copy[i + 1];
          output[i + 1] = copy[i];
        }
      };
      multi.applyTransform(mod);
      expect(multi.getCoordinates()).to.eql([[2, 1], [4, 3]]);
    });

    it('returns undefined', function() {
      var got = multi.applyTransform(transform);
      expect(got).to.be(undefined);
    });

  });

  describe('#transform()', function() {

    it('transforms a geometry given CRS identifiers', function() {
      var multi = new ol.geom.MultiPoint([[-111, 45], [111, -45]]).transform(
          'EPSG:4326', 'EPSG:3857');

      expect(multi).to.be.a(ol.geom.MultiPoint);

      var coords = multi.getCoordinates();

      expect(coords[0][0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[0][1]).to.roughlyEqual(5621521.48, 1e-2);

      expect(coords[1][0]).to.roughlyEqual(12356463.47, 1e-2);
      expect(coords[1][1]).to.roughlyEqual(-5621521.48, 1e-2);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
