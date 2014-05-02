goog.provide('ol.test.geom.Point');


describe('ol.geom.Point', function() {

  it('can be constructed with a null geometry', function() {
    expect(function() {
      var point = new ol.geom.Point(null);
      point = point; // suppress gjslint warning
    }).not.to.throwException();
  });

  describe('construct with 2D coordinates', function() {

    var point;
    beforeEach(function() {
      point = new ol.geom.Point([1, 2]);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.GeometryLayout.XY);
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
      point = new ol.geom.Point([1, 2, 3], ol.geom.GeometryLayout.XYM);
    });

    it('has the expected layout', function() {
      expect(point.getLayout()).to.be(ol.geom.GeometryLayout.XYM);
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
      expect(point.getLayout()).to.be(ol.geom.GeometryLayout.XYZM);
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

    describe('#getClosestPoint', function() {

      it('preseves extra dimensions', function() {
        var closestPoint = point.getClosestPoint([0, 0]);
        expect(closestPoint).to.eql([1, 2, 3, 4]);
      });

    });

  });

  describe('#applyTransform()', function() {

    var point, transform;
    beforeEach(function() {
      point = new ol.geom.Point([1, 2]);
      transform = sinon.spy();
    });

    it('calls a transform function', function() {
      point.applyTransform(transform);
      expect(transform.calledOnce).to.be(true);
      var args = transform.firstCall.args;
      expect(args).to.have.length(3);

      expect(args[0]).to.be(point.getFlatCoordinates()); // input coords
      expect(args[1]).to.be(point.getFlatCoordinates()); // output coords
      expect(args[2]).to.be(2); // dimension
    });

    it('allows for modification of coordinates', function() {
      var mod = function(input, output, dimension) {
        var copy = input.slice();
        output[1] = copy[0];
        output[0] = copy[1];
      };
      point.applyTransform(mod);
      expect(point.getCoordinates()).to.eql([2, 1]);
    });

    it('returns undefined', function() {
      var got = point.applyTransform(transform);
      expect(got).to.be(undefined);
    });

  });

  describe('#transform()', function() {

    it('transforms a geometry given CRS identifiers', function() {
      var point = new ol.geom.Point([-111, 45]).transform(
          'EPSG:4326', 'EPSG:3857');

      expect(point).to.be.a(ol.geom.Point);

      var coords = point.getCoordinates();

      expect(coords[0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[1]).to.roughlyEqual(5621521.48, 1e-2);
    });

    it('modifies the original', function() {
      var point = new ol.geom.Point([-111, 45]);
      point.transform('EPSG:4326', 'EPSG:3857');
      var coords = point.getCoordinates();

      expect(coords[0]).to.roughlyEqual(-12356463.47, 1e-2);
      expect(coords[1]).to.roughlyEqual(5621521.48, 1e-2);
    });

  });

});


goog.require('ol.extent');
goog.require('ol.geom.Point');
