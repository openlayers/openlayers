goog.provide('ol.test.parser.GeoJSON');

describe('ol.parser.GeoJSON', function() {

  var parser = new ol.parser.GeoJSON();

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

  describe('#read()', function() {

    it('parses point', function() {
      var str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20]
      });

      var obj = parser.read(str);
      expect(obj).toBeA(ol.geom.Point);
      expect(obj.getCoordinates()).toEqual([10, 20]);
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20], [30, 40]]
      });

      var obj = parser.read(str);
      expect(obj).toBeA(ol.geom.LineString);
      expect(obj.getCoordinates()).toEqual([[10, 20], [30, 40]]);
    });

    it('parses polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
          inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]],
          str = JSON.stringify({
            type: 'Polygon',
            coordinates: [outer, inner1, inner2]
          });

      var obj = parser.read(str);
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

      var array = parser.read(str);
      expect(array.length).toBe(2);
      expect(array[0]).toBeA(ol.geom.Point);
      expect(array[1]).toBeA(ol.geom.LineString);
    });

    it('parses feature collection', function() {
      var str = JSON.stringify(data),
          array = parser.read(str);

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

    it('parses countries.json', function() {
      afterLoadText('spec/ol/parser/geojson/countries.json', function(text) {
        var result = parser.read(text);
        expect(result.length).toBe(179);

        var first = result[0];
        expect(first).toBeA(ol.Feature);
        expect(first.get('name')).toBe('Afghanistan');
        var firstGeom = first.getGeometry();
        expect(firstGeom).toBeA(ol.geom.Polygon);
        expect(firstGeom.getBounds().equals(
            new ol.Extent(60.52843, 29.318572, 75.158028, 38.486282)))
            .toBe(true);

        var last = result[178];
        expect(last).toBeA(ol.Feature);
        expect(last.get('name')).toBe('Zimbabwe');
        var lastGeom = last.getGeometry();
        expect(lastGeom).toBeA(ol.geom.Polygon);
        expect(lastGeom.getBounds().equals(
            new ol.Extent(25.264226, -22.271612, 32.849861, -15.507787)))
            .toBe(true);
      });
    });

    it('parses countries.json with shared vertices', function() {
      afterLoadText('spec/ol/parser/geojson/countries.json', function(text) {
        var pointVertices = new ol.geom.SharedVertices();
        var lineVertices = new ol.geom.SharedVertices();
        var polygonVertices = new ol.geom.SharedVertices();

        var result = parser.read(text, {
          pointVertices: pointVertices,
          lineVertices: lineVertices,
          polygonVertices: polygonVertices
        });
        expect(result.length).toBe(179);

        expect(pointVertices.coordinates.length).toBe(0);
        expect(lineVertices.coordinates.length).toBe(0);
        expect(polygonVertices.coordinates.length).toBe(21344);

        var first = result[0];
        expect(first).toBeA(ol.Feature);
        expect(first.get('name')).toBe('Afghanistan');
        var firstGeom = first.getGeometry();
        expect(firstGeom).toBeA(ol.geom.Polygon);
        expect(firstGeom.getBounds().equals(
            new ol.Extent(60.52843, 29.318572, 75.158028, 38.486282)))
            .toBe(true);

        var last = result[178];
        expect(last).toBeA(ol.Feature);
        expect(last.get('name')).toBe('Zimbabwe');
        var lastGeom = last.getGeometry();
        expect(lastGeom).toBeA(ol.geom.Polygon);
        expect(lastGeom.getBounds().equals(
            new ol.Extent(25.264226, -22.271612, 32.849861, -15.507787)))
            .toBe(true);
      });
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
goog.require('ol.parser.GeoJSON');
