goog.provide('ol.test.geom.GeometryCollection');


describe('ol.geom.GeometryCollection', function() {

  var outer = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
      inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];

  describe('constructor', function() {

    var line, multi, point, poly;
    beforeEach(function() {
      point = new ol.geom.Point([10, 20]);
      line = new ol.geom.LineString([[10, 20], [30, 40]]);
      poly = new ol.geom.Polygon([outer, inner1, inner2]);
      multi = new ol.geom.GeometryCollection([point, line, poly]);
    });

    it('creates a geometry collection from an array of geometries', function() {
      expect(multi).to.be.a(ol.geom.GeometryCollection);
      expect(multi).to.be.a(ol.geom.Geometry);
    });

    it('fires a change event when one of its component changes',
        function(done) {
          multi.on('change', function() {
            done();
          });
          point.setCoordinates([10, 10]);
        }
    );

    it('deregister old components', function() {
      multi.setGeometries([poly]);
      multi.on('change', function() {
        expect().fail();
      });
      point.setCoordinates([10, 10]);
    });

    it('register new components', function(done) {
      var point2 = new ol.geom.Point([10, 20]);
      multi.setGeometriesArray([point2]);
      multi.on('change', function() {
        done();
      });
      point2.setCoordinates([10, 10]);
    });

  });

  describe('#getGeometries', function() {

    it('returns a collection of geometries', function() {
      var point = new ol.geom.Point([10, 20]);
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var multi = new ol.geom.GeometryCollection([point, line, poly]);

      var geometries = multi.getGeometries();
      expect(geometries).to.be.an(Array);
      expect(geometries).to.have.length(3);
      expect(geometries[0]).to.be.a(ol.geom.Point);
      expect(geometries[1]).to.be.a(ol.geom.LineString);
      expect(geometries[2]).to.be.a(ol.geom.Polygon);
    });

  });

  describe('#clone()', function() {

    it('has a working clone method', function() {
      var point = new ol.geom.Point([10, 20]);
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var multi = new ol.geom.GeometryCollection([point, line, poly]);
      var clone = multi.clone();
      expect(clone).to.not.be(multi);
      var geometries = clone.getGeometries();
      expect(geometries[0].getCoordinates()).to.eql([10, 20]);
      expect(geometries[1].getCoordinates()).to.eql([[10, 20], [30, 40]]);
      expect(geometries[2].getCoordinates()).to.eql([outer, inner1, inner2]);
    });

    it('does a deep clone', function() {
      var point = new ol.geom.Point([30, 40]);
      var originalGeometries = [point];
      var multi = new ol.geom.GeometryCollection(originalGeometries);
      var clone = multi.clone();
      var clonedGeometries = clone.getGeometries();
      expect(clonedGeometries).not.to.be(originalGeometries);
      expect(clonedGeometries).to.have.length(originalGeometries.length);
      expect(clonedGeometries).to.have.length(1);
      expect(clonedGeometries[0]).not.to.be(originalGeometries[0]);
      expect(clonedGeometries[0].getCoordinates()).
          to.eql(originalGeometries[0].getCoordinates());
    });

  });

  describe('#getExtent()', function() {

    it('returns the bounding extent', function() {
      var point = new ol.geom.Point([10, 2]);
      var line = new ol.geom.LineString([[1, 20], [30, 40]]);
      var multi = new ol.geom.GeometryCollection([point, line]);
      var extent = multi.getExtent();
      expect(extent[0]).to.be(1);
      expect(extent[2]).to.be(30);
      expect(extent[1]).to.be(2);
      expect(extent[3]).to.be(40);
    });

  });

  describe('#setGeometries', function() {

    var line, multi, point, poly;
    beforeEach(function() {
      point = new ol.geom.Point([10, 20]);
      line = new ol.geom.LineString([[10, 20], [30, 40]]);
      poly = new ol.geom.Polygon([outer, inner1, inner2]);
      multi = new ol.geom.GeometryCollection([point, line, poly]);
    });

    it('fires a change event', function() {
      var listener = sinon.spy();
      multi.on('change', listener);
      multi.setGeometries([point, line, poly]);
      expect(listener.calledOnce).to.be(true);
    });

    it('updates the extent', function() {
      expect(multi.getExtent()).to.eql([0, 0, 30, 40]);
      line.setCoordinates([[10, 20], [300, 400]]);
      expect(multi.getExtent()).to.eql([0, 0, 300, 400]);
    });

  });

  describe('#transform()', function() {

    var line, multi, point;
    beforeEach(function() {
      point = new ol.geom.Point([10, 20]);
      line = new ol.geom.LineString([[10, 20], [30, 40]]);
      multi = new ol.geom.GeometryCollection([point, line]);
    });

    it('transforms all geometries', function() {
      multi.transform('EPSG:4326', 'EPSG:3857');

      var geometries = multi.getGeometries();
      expect(geometries[0]).to.be.a(ol.geom.Point);
      expect(geometries[1]).to.be.a(ol.geom.LineString);

      var coords = geometries[0].getCoordinates();
      expect(coords[0]).to.roughlyEqual(1113194.90, 1e-2);
      expect(coords[1]).to.roughlyEqual(2273030.92, 1e-2);

      coords = geometries[1].getCoordinates();
      expect(coords[0][0]).to.roughlyEqual(1113194.90, 1e-2);
      expect(coords[0][1]).to.roughlyEqual(2273030.92, 1e-2);
      expect(coords[1][0]).to.roughlyEqual(3339584.72, 1e-2);
      expect(coords[1][1]).to.roughlyEqual(4865942.27, 1e-2);
    });

  });

});


goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
