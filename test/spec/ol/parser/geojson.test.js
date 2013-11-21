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

  describe('#write()', function() {

    it('encodes point', function() {
      var point = new ol.geom.Point([10, 20]);
      var geojson = parser.write(point);
      expect(point.getCoordinates()).to.eql(
          parser.read(geojson).getCoordinates());
    });

    it('encodes linestring', function() {
      var linestring = new ol.geom.LineString([[10, 20], [30, 40]]);
      var geojson = parser.write(linestring);
      expect(linestring.getCoordinates()).to.eql(
          parser.read(geojson).getCoordinates());
    });

    it('encodes polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
          inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      var polygon = new ol.geom.Polygon([outer, inner1, inner2]);
      var geojson = parser.write(polygon);
      expect(polygon.getCoordinates()).to.eql(
          parser.read(geojson).getCoordinates());
    });

    it('encodes geometry collection', function() {
      var collection = new ol.geom.GeometryCollection([
        new ol.geom.Point([10, 20]),
        new ol.geom.LineString([[30, 40], [50, 60]])
      ]);
      var geojson = parser.write(collection);
      var got = parser.read(geojson);
      var components = collection.getComponents();
      expect(components.length).to.equal(got.length);
      for (var i = 0, ii = components.length; i < ii; ++i) {
        expect(components[i].getCoordinates()).to.eql(got[i].getCoordinates());
      }
    });

    it('encodes feature collection', function() {
      var str = JSON.stringify(data),
          array = parser.read(str);
      var geojson = parser.write(array);
      var result = parser.read(geojson);
      expect(array.length).to.equal(result.length);
      var got, exp, gotAttr, expAttr;
      for (var i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().getCoordinates()).to.eql(
            exp.getGeometry().getCoordinates());
        gotAttr = got.getAttributes();
        delete gotAttr.geometry;
        expAttr = exp.getAttributes();
        delete expAttr.geometry;
        expect(gotAttr).to.eql(expAttr);
      }
    });

  });

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
      var rings = obj.getRings();
      expect(rings.length).to.be(3);
      expect(rings[0]).to.be.a(ol.geom.LinearRing);
      expect(rings[1]).to.be.a(ol.geom.LinearRing);
      expect(rings[2]).to.be.a(ol.geom.LinearRing);
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

    it('parses countries.geojson', function(done) {
      afterLoadText('spec/ol/parser/geojson/countries.geojson', function(text) {
        var result = parser.read(text);
        expect(result.length).to.be(179);

        var first = result[0];
        expect(first).to.be.a(ol.Feature);
        expect(first.get('name')).to.be('Afghanistan');
        expect(first.getId()).to.be('AFG');
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(firstGeom.getBounds(),
            [60.52843, 29.318572, 75.158028, 38.486282]))
            .to.be(true);

        var last = result[178];
        expect(last).to.be.a(ol.Feature);
        expect(last.get('name')).to.be('Zimbabwe');
        expect(last.getId()).to.be('ZWE');
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(lastGeom.getBounds(),
            [25.264226, -22.271612, 32.849861, -15.507787]))
            .to.be(true);
        done();
      });
    });

  });

  describe('#parseAsFeatureCollection_()', function() {

    it('generates an array of features for FeatureCollection', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            foo: 'bar'
          },
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        }, {
          type: 'Feature',
          properties: {
            bam: 'baz'
          },
          geometry: {
            type: 'LineString',
            coordinates: [[1, 2], [3, 4]]
          }
        }]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(2);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(ol.geom.Point);

      var second = features[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(ol.geom.LineString);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });

    it('reads named crs from top-level object', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:1234'
          }
        },
        features: [{
          type: 'Feature',
          properties: {
            foo: 'bar'
          },
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        }, {
          type: 'Feature',
          properties: {
            bam: 'baz'
          },
          geometry: {
            type: 'LineString',
            coordinates: [[1, 2], [3, 4]]
          }
        }]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(2);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(ol.geom.Point);

      var second = features[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(ol.geom.LineString);

      expect(result.metadata.projection).to.be('EPSG:1234');
    });

    it('accepts null crs', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'FeatureCollection',
        crs: null,
        features: [{
          type: 'Feature',
          properties: {
            foo: 'bar'
          },
          geometry: {
            type: 'Point',
            coordinates: [1, 2]
          }
        }, {
          type: 'Feature',
          properties: {
            bam: 'baz'
          },
          geometry: {
            type: 'LineString',
            coordinates: [[1, 2], [3, 4]]
          }
        }]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(2);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(ol.geom.Point);

      var second = features[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(ol.geom.LineString);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });

    it('generates an array of features for Feature', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'Feature',
        properties: {
          bam: 'baz'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[1, 2], [3, 4]]
        }
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(1);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('bam')).to.be('baz');
      expect(first.getGeometry()).to.be.a(ol.geom.LineString);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });

    it('generates an array of features for GeometryCollection', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'GeometryCollection',
        geometries: [{
          type: 'Point',
          coordinates: [1, 2]
        }, {
          type: 'LineString',
          coordinates: [[3, 4], [5, 6]]
        }, {
          type: 'Polygon',
          coordinates: [[[7, 8], [9, 10], [11, 12], [7, 8]]]
        }]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(3);

      expect(features[0].getGeometry()).to.be.a(ol.geom.Point);
      expect(features[1].getGeometry()).to.be.a(ol.geom.LineString);
      expect(features[2].getGeometry()).to.be.a(ol.geom.Polygon);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });

    it('generates an array of features for Point', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'Point',
        coordinates: [1, 2]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(1);

      expect(features[0].getGeometry()).to.be.a(ol.geom.Point);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });

    it('generates an array of features for LineString', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'LineString',
        coordinates: [[3, 4], [5, 6]]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(1);

      expect(features[0].getGeometry()).to.be.a(ol.geom.LineString);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });

    it('generates an array of features for Polygon', function() {

      var parser = new ol.parser.GeoJSON();
      var json = {
        type: 'Polygon',
        coordinates: [[[7, 8], [9, 10], [11, 12], [7, 8]]]
      };
      var result = parser.parseAsFeatureCollection_(json);
      var features = result.features;

      expect(features.length).to.be(1);

      expect(features[0].getGeometry()).to.be.a(ol.geom.Polygon);

      expect(result.metadata.projection).to.be('EPSG:4326');
    });


  });

});

goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.GeoJSON');
