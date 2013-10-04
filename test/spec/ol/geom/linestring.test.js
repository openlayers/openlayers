goog.provide('ol.test.geom.LineString');

describe('ol.geom.LineString', function() {

  describe('constructor', function() {

    it('creates a linestring from an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line).to.be.a(ol.geom.LineString);
      expect(line).to.be.a(ol.geom.Geometry);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var line = new ol.geom.LineString([[10, 20], [20, 30], [30, 40]]);
      var bounds = line.getBounds();
      expect(bounds[0]).to.be(10);
      expect(bounds[2]).to.be(30);
      expect(bounds[1]).to.be(20);
      expect(bounds[3]).to.be(40);
    });

  });

  describe('#getCoordinates', function() {

    it('returns an array', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.getCoordinates()).to.eql([[10, 20], [30, 40]]);
    });

  });

  describe('#setCoordinates()', function() {

    it('updates the coordinates', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      line.setCoordinates([[30, 40], [50, 60]]);
      expect(line.getCoordinates()).to.eql([[30, 40], [50, 60]]);
    });

    it('invalidates bounds', function() {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      line.setCoordinates([[30, 40], [50, 60]]);
      expect(line.getBounds()).to.eql([30, 40, 50, 60]);
    });

    it('triggers a change event', function(done) {
      var line = new ol.geom.LineString([[10, 20], [30, 40]]);
      expect(line.getBounds()).to.eql([10, 20, 30, 40]);
      goog.events.listen(line, 'change', function(evt) {
        expect(evt.target).to.equal(line);
        expect(evt.oldExtent).to.eql([10, 20, 30, 40]);
        expect(evt.target.getBounds()).to.eql([30, 40, 50, 60]);
        expect(evt.target.getCoordinates()).to.eql([[30, 40], [50, 60]]);
        done();
      });
      line.setCoordinates([[30, 40], [50, 60]]);
    });

  });

  describe('#transform()', function() {

    var forward = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
    var inverse = ol.proj.getTransform('EPSG:3857', 'EPSG:4326');

    it('forward transforms a linestring in place', function() {
      var line = new ol.geom.LineString([[10, 20], [20, 30], [30, 40]]);
      line.transform(forward);
      expect(line.get(0, 0)).to.roughlyEqual(1113195, 1);
      expect(line.get(0, 1)).to.roughlyEqual(2273031, 1);
      expect(line.get(1, 0)).to.roughlyEqual(2226390, 1);
      expect(line.get(1, 1)).to.roughlyEqual(3503550, 1);
      expect(line.get(2, 0)).to.roughlyEqual(3339585, 1);
      expect(line.get(2, 1)).to.roughlyEqual(4865942, 1);
    });

    it('inverse transforms a linestring in place', function() {
      var line = new ol.geom.LineString([
        [1113195, 2273031], [2226390, 3503550], [3339585, 4865942]
      ]);
      line.transform(inverse);
      expect(line.get(0, 0)).to.roughlyEqual(10, 0.001);
      expect(line.get(0, 1)).to.roughlyEqual(20, 0.001);
      expect(line.get(1, 0)).to.roughlyEqual(20, 0.001);
      expect(line.get(1, 1)).to.roughlyEqual(30, 0.001);
      expect(line.get(2, 0)).to.roughlyEqual(30, 0.001);
      expect(line.get(2, 1)).to.roughlyEqual(40, 0.001);
    });

  });

});

goog.require('goog.events');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.LineString');
goog.require('ol.proj');
