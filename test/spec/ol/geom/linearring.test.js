goog.provide('ol.test.geom.LinearRing');

describe('ol.geom.LinearRing', function() {

  describe('constructor', function() {

    it('creates a ring from an array', function() {
      var ring = new ol.geom.LinearRing([[10, 20], [30, 40]]);
      expect(ring).to.be.a(ol.geom.LinearRing);
    });

    it('throws when given mismatched dimension', function() {
      expect(function() {
        var ring = new ol.geom.LinearRing([[10, 20], [30, 40, 50]]);
      }).to.throwException();
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var ring = new ol.geom.LinearRing([[10, 20], [30, 40]]);
      expect(ring.dimension).to.be(2);
    });

    it('can be 3', function() {
      var ring = new ol.geom.LinearRing([[10, 20, 30], [40, 50, 60]]);
      expect(ring.dimension).to.be(3);
    });

  });

  describe('#getCoordinates()', function() {

    it('is an array', function() {
      var ring = new ol.geom.LinearRing([[10, 20], [30, 40]]);
      expect(ring.getCoordinates()).to.eql([[10, 20], [30, 40]]);
    });

  });

});

goog.require('ol.geom.LinearRing');
