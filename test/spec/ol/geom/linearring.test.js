describe('ol.geom.LinearRing', function() {

  describe('constructor', function() {

    it('creates a ring from an array', function() {
      var ring = new ol.geom.LinearRing([[10, 20], [30, 40]]);
      expect(ring).toBeA(ol.geom.LinearRing);
    });

    it('throws when given mismatched dimension', function() {
      expect(function() {
        var ring = new ol.geom.LinearRing([[10, 20], [30, 40, 50]]);
      }).toThrow();
    });

  });

  describe('#coordinates', function() {

    it('is a Float64Array', function() {
      var ring = new ol.geom.LinearRing([[10, 20], [30, 40]]);
      expect(ring.coordinates).toBeA(Float64Array);

      expect(ring.coordinates.length).toBe(4);
      expect(ring.coordinates[0]).toBe(10);
      expect(ring.coordinates[1]).toBe(20);
      expect(ring.coordinates[2]).toBe(30);
      expect(ring.coordinates[3]).toBe(40);
    });

  });

  describe('#dimension', function() {

    it('can be 2', function() {
      var ring = new ol.geom.LinearRing([[10, 20], [30, 40]]);
      expect(ring.dimension).toBe(2);
    });

    it('can be 3', function() {
      var ring = new ol.geom.LinearRing([[10, 20, 30], [40, 50, 60]]);
      expect(ring.dimension).toBe(3);
    });

  });


});

