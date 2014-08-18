goog.provide('ol.test.reader.GeoJSON');


describe('ol.format.GeoJSON', function() {

  var format;
  beforeEach(function() {
    format = new ol.format.GeoJSON();
  });

  var pointGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [102.0, 0.5]
    },
    'properties': {
      'prop0': 'value0'
    }
  };

  var nullGeometryGeoJSON = {
    'type': 'Feature',
    'geometry': null,
    'properties': {
      'prop0': 'value0'
    }
  };

  var lineStringGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': [
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ]
    },
    'properties': {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  var polygonGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]
    },
    'properties': {
      'prop0': 'value0',
      'prop1': {'this': 'that'}
    }
  };

  var featureCollectionGeoJSON = {
    'type': 'FeatureCollection',
    'features': [pointGeoJSON, lineStringGeoJSON, polygonGeoJSON]
  };

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

  describe('#readFeature', function() {

    it('can read a single point feature', function() {
      var feature = format.readFeature(pointGeoJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.Point);
      expect(geometry.getCoordinates()).to.eql([102.0, 0.5]);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a single line string feature', function() {
      var feature = format.readFeature(lineStringGeoJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.LineString);
      expect(geometry.getCoordinates()).to.eql(
          [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.be(0.0);
    });

    it('can read a single polygon feature', function() {
      var feature = format.readFeature(polygonGeoJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.Polygon);
      expect(geometry.getCoordinates()).to.eql([[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.eql({'this': 'that'});
    });

    it('can read a feature with null geometry', function() {
      var feature = format.readFeature(nullGeometryGeoJSON);
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.eql(null);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a feature collection', function() {
      var features = format.readFeatures(featureCollectionGeoJSON);
      expect(features).to.have.length(3);
      expect(features[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(features[1].getGeometry()).to.be.an(ol.geom.LineString);
      expect(features[2].getGeometry()).to.be.an(ol.geom.Polygon);
    });

    it('can read and transform a point', function() {
      var feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
          ol.proj.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    it('can read and transform a feature collection', function() {
      var features = format.readFeatures(featureCollectionGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(features[0].getGeometry()).to.be.an(ol.geom.Point);
      expect(features[0].getGeometry().getCoordinates()).to.eql(
          ol.proj.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
      expect(features[1].getGeometry().getCoordinates()).to.eql([
        ol.proj.transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857')
      ]);
      expect(features[2].getGeometry().getCoordinates()).to.eql([[
        ol.proj.transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        ol.proj.transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857')
      ]]);
    });

    it('can create a feature with a specific geometryName', function() {
      var feature = new ol.format.GeoJSON({geometryName: 'the_geom'}).
          readFeature(pointGeoJSON);
      expect(feature.getGeometryName()).to.be('the_geom');
      expect(feature.getGeometry()).to.be.an(ol.geom.Point);
    });

  });

  describe('#readFeatures', function() {

    it('parses feature collection', function() {
      var str = JSON.stringify(data),
          array = format.readFeatures(str);

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
      afterLoadText('spec/ol/format/geojson/countries.geojson', function(text) {
        var result = format.readFeatures(text);
        expect(result.length).to.be(179);

        var first = result[0];
        expect(first).to.be.a(ol.Feature);
        expect(first.get('name')).to.be('Afghanistan');
        expect(first.getId()).to.be('AFG');
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(firstGeom.getExtent(),
            [60.52843, 29.318572, 75.158028, 38.486282]))
            .to.be(true);

        var last = result[178];
        expect(last).to.be.a(ol.Feature);
        expect(last.get('name')).to.be('Zimbabwe');
        expect(last.getId()).to.be('ZWE');
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(ol.geom.Polygon);
        expect(ol.extent.equals(lastGeom.getExtent(),
            [25.264226, -22.271612, 32.849861, -15.507787]))
            .to.be(true);
        done();
      });

    });

    it('generates an array of features for Feature', function() {

      var format = new ol.format.GeoJSON();
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
      var features = format.readFeatures(json);

      expect(features.length).to.be(1);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('bam')).to.be('baz');
      expect(first.getGeometry()).to.be.a(ol.geom.LineString);

      expect(format.readProjection(json)).to.be(ol.proj.get('EPSG:4326'));
    });

  });

  describe('#readGeometry', function() {

    it('parses point', function() {
      var str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Point);
      expect(obj.getCoordinates()).to.eql([10, 20]);
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20], [30, 40]]
      });

      var obj = format.readGeometry(str);
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

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(ol.geom.Polygon);
      var rings = obj.getLinearRings();
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

      var geometryCollection = format.readGeometry(str);
      expect(geometryCollection).to.be.an(ol.geom.GeometryCollection);
      var array = geometryCollection.getGeometries();
      expect(array.length).to.be(2);
      expect(array[0]).to.be.a(ol.geom.Point);
      expect(array[1]).to.be.a(ol.geom.LineString);
    });

  });

  describe('#readProjection', function() {

    it('reads named crs from top-level object', function() {

      var json = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:3857'
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
      var features = format.readFeatures(json);

      expect(features.length).to.be(2);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(ol.geom.Point);

      var second = features[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(ol.geom.LineString);

      expect(format.readProjection(json)).to.be(ol.proj.get('EPSG:3857'));

    });

    it('accepts null crs', function() {

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
      var features = format.readFeatures(json);

      expect(features.length).to.be(2);

      var first = features[0];
      expect(first).to.be.a(ol.Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(ol.geom.Point);

      var second = features[1];
      expect(second).to.be.a(ol.Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(ol.geom.LineString);

      expect(format.readProjection(json)).to.be(ol.proj.get('EPSG:4326'));

    });

    it('can read out-of-specification CRS generated by GeoServer', function() {
      // TODO: remove this when http://jira.codehaus.org/browse/GEOS-5996
      // is fixed and widely deployed.
      var json = {
        crs: {
          type: 'EPSG',
          properties: {
            code: '4326'
          }
        }
      };
      expect(format.readProjection(json)).to.be(ol.proj.get('EPSG:4326'));
    });

  });

  describe('#writeFeatures', function() {

    it('encodes feature collection', function() {
      var str = JSON.stringify(data),
          array = format.readFeatures(str);
      var geojson = format.writeFeatures(array);
      var result = format.readFeatures(geojson);
      expect(array.length).to.equal(result.length);
      var got, exp, gotProp, expProp;
      for (var i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().getCoordinates()).to.eql(
            exp.getGeometry().getCoordinates());
        gotProp = got.getProperties();
        delete gotProp.geometry;
        expProp = exp.getProperties();
        delete expProp.geometry;
        expect(gotProp).to.eql(expProp);
      }
    });

    it('transforms and encodes feature collection', function() {
      var str = JSON.stringify(data),
          array = format.readFeatures(str);
      var geojson = format.writeFeatures(array, {
        featureProjection: 'EPSG:3857'
      });
      var result = format.readFeatures(geojson);
      var got, exp;
      for (var i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().transform('EPSG:3857', 'EPSG:4326')
            .getCoordinates()).to.eql(exp.getGeometry().getCoordinates());
      }
    });

  });

  describe('#writeGeometry', function() {

    it('encodes point', function() {
      var point = new ol.geom.Point([10, 20]);
      var geojson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
          format.readGeometry(geojson).getCoordinates());
    });

    it('encodes linestring', function() {
      var linestring = new ol.geom.LineString([[10, 20], [30, 40]]);
      var geojson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
          format.readGeometry(geojson).getCoordinates());
    });

    it('encodes polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]],
          inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      var polygon = new ol.geom.Polygon([outer, inner1, inner2]);
      var geojson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates()).to.eql(
          format.readGeometry(geojson).getCoordinates());
    });

    it('encodes geometry collection', function() {
      var collection = new ol.geom.GeometryCollection([
        new ol.geom.Point([10, 20]),
        new ol.geom.LineString([[30, 40], [50, 60]])
      ]);
      var geojson = format.writeGeometry(collection);
      var got = format.readGeometry(geojson);
      expect(got).to.be.an(ol.geom.GeometryCollection);
      var gotGeometries = got.getGeometries();
      var geometries = collection.getGeometries();
      expect(geometries.length).to.equal(gotGeometries.length);
      for (var i = 0, ii = geometries.length; i < ii; ++i) {
        expect(geometries[i].getCoordinates()).
            to.eql(gotGeometries[i].getCoordinates());
      }

    });

    it('encodes a circle as an empty geometry collection', function() {
      var circle = new ol.geom.Circle([0, 0], 1);
      var geojson = format.writeGeometry(circle);
      expect(geojson).to.eql({
        'type': 'GeometryCollection',
        'geometries': []
      });
    });

    it('transforms and encodes a point', function() {
      var point = new ol.geom.Point([2, 3]);
      var geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857'
      });
      var newPoint = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857'
      });
      expect(point.getCoordinates()[0]).to.eql(newPoint.getCoordinates()[0]);
      expect(
          Math.abs(point.getCoordinates()[1] - newPoint.getCoordinates()[1]))
          .to.be.lessThan(0.0000001);
    });

  });

});


goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.Circle');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
