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
      expect(obj).to.be.a(ol.geom.Point);
      expect(obj.getCoordinates()).to.eql([10, 20]);
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20], [30, 40]]
      });

      var obj = parser.read(str);
      expect(obj).to.be.a(ol.geom.LineString);
      expect(obj.getCoordinates()).to.eql([[10, 20], [30, 40]]);
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
      expect(obj).to.be.a(ol.geom.Polygon);
      expect(obj.rings.length).to.be(3);
      expect(obj.rings[0]).to.be.a(ol.geom.LinearRing);
      expect(obj.rings[1]).to.be.a(ol.geom.LinearRing);
      expect(obj.rings[2]).to.be.a(ol.geom.LinearRing);
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
      expect(array.length).to.be(2);
      expect(array[0]).to.be.a(ol.geom.Point);
      expect(array[1]).to.be.a(ol.geom.LineString);
    });

    it('parses feature collection', function() {
      var str = JSON.stringify(data),
          array = parser.read(str);

      expect(array.length).to.be(2);

      var first = array[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('LINK_ID')).to.be(573730499);
      var firstGeom = first.getGeometry();
      expect(firstGeom).to.be.a(ol.geom.LineString);

      var second = array[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('ST_NAME')).to.be('BRUNNSGATAN');
      var secondGeom = second.getGeometry();
      expect(secondGeom).to.be.a(ol.geom.LineString);
    });

    it('parses countries.json', function(done) {
      afterLoadText('spec/ol/parser/geojson/countries.json', function(text) {
        var result = parser.read(text);
        expect(result.length).to.be(179);

        var first = result[0];
        expect(first).to.be.a(ol.Feature);
        expect(first.get('name')).to.be('Afghanistan');
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(firstGeom.getBounds(),
            [60.52843, 75.158028, 29.318572, 38.486282]))
            .to.be(true);

        var last = result[178];
        expect(last).to.be.a(ol.Feature);
        expect(last.get('name')).to.be('Zimbabwe');
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(lastGeom.getBounds(),
            [25.264226, 32.849861, -22.271612, -15.507787]))
            .to.be(true);
        done();
      });
    });

    it('parses countries.json with shared vertices', function() {
      afterLoadText('spec/ol/parser/geojson/countries.json', function(text) {
        var pointVertices = new ol.geom.SharedVertices();
        var lineVertices = new ol.geom.SharedVertices();
        var polygonVertices = new ol.geom.SharedVertices();

        var lookup = {
          'point': pointVertices,
          'linestring': lineVertices,
          'polygon': polygonVertices,
          'multipoint': pointVertices,
          'multilinstring': lineVertices,
          'multipolygon': polygonVertices
        };

        var callback = function(feature, type) {
          return lookup[type];
        };

        var result = parser.readFeaturesFromString(text, {callback: callback});
        expect(result.length).to.be(179);

        expect(pointVertices.coordinates.length).to.be(0);
        expect(lineVertices.coordinates.length).to.be(0);
        expect(polygonVertices.coordinates.length).to.be(21344);

        var first = result[0];
        expect(first).to.be.a(ol.Feature);
        expect(first.get('name')).to.be('Afghanistan');
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(firstGeom.getBounds(),
            [60.52843, 75.158028, 29.318572, 38.486282]))
            .to.be(true);

        var last = result[178];
        expect(last).to.be.a(ol.Feature);
        expect(last.get('name')).to.be('Zimbabwe');
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(lastGeom.getBounds(),
            [25.264226, 32.849861, -22.271612, -15.507787]))
            .to.be(true);
      });
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.SharedVertices');
goog.require('ol.parser.GeoJSON');
