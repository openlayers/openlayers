gooog.require('ol.test.geom.Polygon');

describe('ol.geom.Polygon', function() {

  var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
      inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
      inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];

  describe('constructor', function() {

    it('creates a polygon from an array', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly).toBeA(ol.geom.Polygon);
    });

    it('throws when given mismatched dimension', function() {
      expect(function() {
        var poly = new ol.geom.Polygon([[[10, 20], [30, 40, 50]]]);
      }).toThrow();
    });

  });

  describe('#rings', function() {

    it('is an array of LinearRing', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);

      expect(poly.rings.length).toBe(3);
      expect(poly.rings[0]).toBeA(ol.geom.LinearRing);
      expect(poly.rings[1]).toBeA(ol.geom.LinearRing);
      expect(poly.rings[2]).toBeA(ol.geom.LinearRing);
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      expect(poly.dimension).toBe(2);
    });

    it('can be 3', function() {
      var poly = new ol.geom.Polygon([[[10, 20, 30], [40, 50, 60]]]);
      expect(poly.dimension).toBe(3);
    });

  });

  describe('#getBounds()', function() {

    it('returns the bounding extent', function() {
      var poly = new ol.geom.Polygon([outer, inner1, inner2]);
      var bounds = poly.getBounds();
      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxX).toBe(10);
      expect(bounds.maxY).toBe(10);
    });

  });


});

goog.require('ol.geom.Polygon');
