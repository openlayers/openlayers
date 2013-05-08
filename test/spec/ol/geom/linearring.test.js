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

  describe('#containsCoordinate()', function() {

    it('knows when a point coordinate is inside a ring', function() {
      /**
       *  The ring:
       *                      edge 3
       *          (5, 10)  __________ (15, 10)
       *                 /         /
       *        edge 4 /         / edge 2
       *             /         /
       *    (0, 0) /_________/ (10, 0)
       *             edge 1
       */
      var ring = new ol.geom.LinearRing(
          [[0, 0], [10, 0], [15, 10], [5, 10]]);

      // contains: 1 (touches - not implemented), true (within), false (outside)
      var cases = [{
        point: [5, 5], contains: true
      }, {
        point: [20, 20], contains: false
      }, {
        point: [15, 15], contains: false
      }/*, {
        point: [0, 0], contains: 1 // lower left corner
      }, {
        point: [10, 0], contains: 1 // lower right corner
      }, {
        point: [15, 10], contains: 1 // upper right corner
      }, {
        point: [5, 10], contains: 1 // upper left corner
      }, {
        point: [5, 0], contains: 1 // on edge 1
      }*/, {
        point: [5, -0.1], contains: false // below edge 1
      }, {
        point: [5, 0.1], contains: true // above edge 1
      }/*, {
        point: [12.5, 5], contains: 1 // on edge 2
      }*/, {
        point: [12.4, 5], contains: true // left of edge 2
      }, {
        point: [12.6, 5], contains: false // right of edge 2
      }/*, {
        point: [10, 10], contains: 1 // on edge 3
      }*/, {
        point: [10, 9.9], contains: true // below edge 3
      }, {
        point: [10, 10.1], contains: false // above edge 3
      }/*, {
        point: [2.5, 5], contains: 1 // on edge 4
      }*/, {
        point: [2.4, 5], contains: false // left of edge 4
      }, {
        point: [2.6, 5], contains: true // right of edge 4
      }];

      var c;
      for (var i = 0, ii = cases.length; i < ii; ++i) {
        c = cases[i];
        expect(ring.containsCoordinate(c.point)).to.be(c.contains);
      }
    });
  });

});

goog.require('ol.geom.LinearRing');
