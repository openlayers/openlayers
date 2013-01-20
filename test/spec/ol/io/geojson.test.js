describe('ol.io.geojson', function() {

  describe('read()', function() {

    it('parses point', function() {
      var str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20]
      });

      var obj = ol.io.geojson.read(str);
      expect(obj).toBeA(ol.geom.Point);
      expect(obj.coordinates[0]).toBe(10);
      expect(obj.coordinates[1]).toBe(20);
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20], [30, 40]]
      });

      var obj = ol.io.geojson.read(str);
      expect(obj).toBeA(ol.geom.LineString);
      expect(obj.coordinates[0]).toBe(10);
      expect(obj.coordinates[1]).toBe(20);
      expect(obj.coordinates[2]).toBe(30);
      expect(obj.coordinates[3]).toBe(40);
    });

    it('parses polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
          inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]],
          str = JSON.stringify({
            type: 'Polygon',
            coordinates: [outer, inner1, inner2]
          });

      var obj = ol.io.geojson.read(str);
      expect(obj).toBeA(ol.geom.Polygon);
      expect(obj.rings.length).toBe(3);
      expect(obj.rings[0]).toBeA(ol.geom.LinearRing);
      expect(obj.rings[1]).toBeA(ol.geom.LinearRing);
      expect(obj.rings[2]).toBeA(ol.geom.LinearRing);
    });

    it('parses geometry collection', function() {
      var str = JSON.stringify({
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [10, 20]},
          {type: 'LineString', coordinates: [[30, 40], [50, 60]]}
        ]
      });

      var array = ol.io.geojson.read(str);
      expect(array.length).toBe(2);
      expect(array[0]).toBeA(ol.geom.Point);
      expect(array[1]).toBeA(ol.geom.LineString);
    });

  });

});
