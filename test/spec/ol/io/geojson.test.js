describe('ol.io.geojson', function() {

  var data = {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'properties': {
          'LINK_ID': 573730499,
          'RP_TYPE': 14,
          'RP_FUNC': 0,
          'DIRECTION': 2,
          'LOGKOD': '',
          'CHANGED': '',
          'USERID': '',
          'ST_NAME': '',
          'L_REFADDR': '',
          'L_NREFADDR': '',
          'R_REFADDR': '',
          'R_NREFADDR': '',
          'SPEED_CAT': '7',
          'ZIPCODE': '59330',
          'SHAPE_LEN': 46.3826
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [1549497.66985, 6403707.96],
            [1549491.1, 6403710.1],
            [1549488.03995, 6403716.7504],
            [1549488.5401, 6403724.5504],
            [1549494.37985, 6403733.54],
            [1549499.6799, 6403738.0504],
            [1549506.22, 6403739.2504]
          ]
        }
      }, {
        'type': 'Feature',
        'properties': {
          'LINK_ID': 30760556,
          'RP_TYPE': 12,
          'RP_FUNC': 1,
          'DIRECTION': 0,
          'LOGKOD': '',
          'CHANGED': '',
          'USERID': '',
          'ST_NAME': 'BRUNNSGATAN',
          'L_REFADDR': '24',
          'L_NREFADDR': '16',
          'R_REFADDR': '',
          'R_NREFADDR': '',
          'SPEED_CAT': '7',
          'ZIPCODE': '59330',
          'SHAPE_LEN': 70.3106
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [1549754.2769, 6403854.8024],
            [1549728.45985, 6403920.2]
          ]
        }
      }
    ]
  };

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

    it('parses feature collection', function() {
      var str = JSON.stringify(data),
          array = ol.io.geojson.read(str);

      expect(array.length).toBe(2);

      var first = array[0];
      expect(first).toBeA(ol.Feature);
      expect(first.get('LINK_ID')).toBe(573730499);
      var firstGeom = first.getGeometry();
      expect(firstGeom).toBeA(ol.geom.LineString);

      var second = array[1];
      expect(second).toBeA(ol.Feature);
      expect(second.get('ST_NAME')).toBe('BRUNNSGATAN');
      var secondGeom = second.getGeometry();
      expect(secondGeom).toBeA(ol.geom.LineString);
    });

  });

});
