

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_extent_ from '../../../../src/ol/extent';
import _ol_format_GeoJSON_ from '../../../../src/ol/format/geojson';
import _ol_geom_Circle_ from '../../../../src/ol/geom/circle';
import _ol_geom_GeometryCollection_ from '../../../../src/ol/geom/geometrycollection';
import _ol_geom_LineString_ from '../../../../src/ol/geom/linestring';
import _ol_geom_LinearRing_ from '../../../../src/ol/geom/linearring';
import _ol_geom_MultiPolygon_ from '../../../../src/ol/geom/multipolygon';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_proj_ from '../../../../src/ol/proj';


describe('ol.format.GeoJSON', function() {

  var format;
  beforeEach(function() {
    format = new _ol_format_GeoJSON_();
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

  var zeroIdGeoJSON = {
    'type': 'Feature',
    'id': 0,
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
    'features': [{
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
    }]
  };

  describe('#readFeature', function() {

    it('can read a single point feature', function() {
      var feature = format.readFeature(pointGeoJSON);
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_Point_);
      expect(geometry.getCoordinates()).to.eql([102.0, 0.5]);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a single point geometry as a feature', function() {
      var feature = format.readFeature(pointGeoJSON.geometry);
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_Point_);
      expect(geometry.getCoordinates()).to.eql([102.0, 0.5]);
    });

    it('can read a single line string feature', function() {
      var feature = format.readFeature(lineStringGeoJSON);
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_LineString_);
      expect(geometry.getCoordinates()).to.eql(
          [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.be(0.0);
    });

    it('can read a single polygon feature', function() {
      var feature = format.readFeature(polygonGeoJSON);
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(_ol_geom_Polygon_);
      expect(geometry.getCoordinates()).to.eql([[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.eql({'this': 'that'});
    });

    it('can read a feature with null geometry', function() {
      var feature = format.readFeature(nullGeometryGeoJSON);
      expect(feature).to.be.an(_ol_Feature_);
      var geometry = feature.getGeometry();
      expect(geometry).to.eql(null);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a feature with id equal to 0', function() {
      var feature = format.readFeature(zeroIdGeoJSON);
      expect(feature).to.be.an(_ol_Feature_);
      expect(feature.getId()).to.be(0);
    });

    it('can read a feature collection', function() {
      var features = format.readFeatures(featureCollectionGeoJSON);
      expect(features).to.have.length(3);
      expect(features[0].getGeometry()).to.be.an(_ol_geom_Point_);
      expect(features[1].getGeometry()).to.be.an(_ol_geom_LineString_);
      expect(features[2].getGeometry()).to.be.an(_ol_geom_Polygon_);
    });

    it('can read and transform a point', function() {
      var feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature[0].getGeometry()).to.be.an(_ol_geom_Point_);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
          _ol_proj_.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    it('uses featureProjection passed to the constructor', function() {
      var format = new _ol_format_GeoJSON_({featureProjection: 'EPSG:3857'});
      var feature = format.readFeatures(pointGeoJSON);
      expect(feature[0].getGeometry()).to.be.an(_ol_geom_Point_);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
          _ol_proj_.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    it('gives precedence to options passed to the read method', function() {
      var format = new _ol_format_GeoJSON_({featureProjection: 'EPSG:1234'});
      var feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature[0].getGeometry()).to.be.an(_ol_geom_Point_);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
          _ol_proj_.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    it('can read and transform a feature collection', function() {
      var features = format.readFeatures(featureCollectionGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(features[0].getGeometry()).to.be.an(_ol_geom_Point_);
      expect(features[0].getGeometry().getCoordinates()).to.eql(
          _ol_proj_.transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
      expect(features[1].getGeometry().getCoordinates()).to.eql([
        _ol_proj_.transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        _ol_proj_.transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        _ol_proj_.transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        _ol_proj_.transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857')
      ]);
      expect(features[2].getGeometry().getCoordinates()).to.eql([[
        _ol_proj_.transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        _ol_proj_.transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        _ol_proj_.transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        _ol_proj_.transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857')
      ]]);
    });

    it('can create a feature with a specific geometryName', function() {
      var feature = new _ol_format_GeoJSON_({geometryName: 'the_geom'}).
          readFeature(pointGeoJSON);
      expect(feature.getGeometryName()).to.be('the_geom');
      expect(feature.getGeometry()).to.be.an(_ol_geom_Point_);
    });

  });

  describe('#readFeatures', function() {

    it('parses feature collection', function() {
      var str = JSON.stringify(data);
      var array = format.readFeatures(str);

      expect(array.length).to.be(2);

      var first = array[0];
      expect(first).to.be.a(_ol_Feature_);
      expect(first.get('LINK_ID')).to.be(573730499);
      var firstGeom = first.getGeometry();
      expect(firstGeom).to.be.a(_ol_geom_LineString_);

      var second = array[1];
      expect(second).to.be.a(_ol_Feature_);
      expect(second.get('ST_NAME')).to.be('BRUNNSGATAN');
      var secondGeom = second.getGeometry();
      expect(secondGeom).to.be.a(_ol_geom_LineString_);
    });

    it('can parse a polygon geometry as an array of one feature', function() {
      var features = format.readFeatures(polygonGeoJSON);
      expect(features).to.be.an(Array);
      expect(features).to.have.length(1);
      var geometry = features[0].getGeometry();
      expect(geometry).to.be.an(_ol_geom_Polygon_);
    });

    it('parses countries.geojson', function(done) {
      afterLoadText('spec/ol/format/geojson/countries.geojson', function(text) {
        var result = format.readFeatures(text);
        expect(result.length).to.be(179);

        var first = result[0];
        expect(first).to.be.a(_ol_Feature_);
        expect(first.get('name')).to.be('Afghanistan');
        expect(first.getId()).to.be('AFG');
        var firstGeom = first.getGeometry();
        expect(firstGeom).to.be.a(_ol_geom_Polygon_);
        expect(_ol_extent_.equals(firstGeom.getExtent(),
            [60.52843, 29.318572, 75.158028, 38.486282]))
            .to.be(true);

        var last = result[178];
        expect(last).to.be.a(_ol_Feature_);
        expect(last.get('name')).to.be('Zimbabwe');
        expect(last.getId()).to.be('ZWE');
        var lastGeom = last.getGeometry();
        expect(lastGeom).to.be.a(_ol_geom_Polygon_);
        expect(_ol_extent_.equals(lastGeom.getExtent(),
            [25.264226, -22.271612, 32.849861, -15.507787]))
            .to.be(true);
        done();
      });

    });

    it('generates an array of features for Feature', function() {

      var format = new _ol_format_GeoJSON_();
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
      expect(first).to.be.a(_ol_Feature_);
      expect(first.get('bam')).to.be('baz');
      expect(first.getGeometry()).to.be.a(_ol_geom_LineString_);

      expect(format.readProjection(json)).to.be(_ol_proj_.get('EPSG:4326'));
    });

  });

  describe('#readGeometry', function() {

    it('parses point', function() {
      var str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(_ol_geom_Point_);
      expect(obj.getCoordinates()).to.eql([10, 20]);
      expect(obj.getLayout()).to.eql('XY');
    });

    it('parses linestring', function() {
      var str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20], [30, 40]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(_ol_geom_LineString_);
      expect(obj.getCoordinates()).to.eql([[10, 20], [30, 40]]);
      expect(obj.getLayout()).to.eql('XY');
    });

    it('parses XYZ linestring', function() {
      var str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20, 1534], [30, 40, 1420]]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(_ol_geom_LineString_);
      expect(obj.getLayout()).to.eql('XYZ');
      expect(obj.getCoordinates()).to.eql([[10, 20, 1534], [30, 40, 1420]]);
    });

    it('parses polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      var inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      var inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      var str = JSON.stringify({
        type: 'Polygon',
        coordinates: [outer, inner1, inner2]
      });

      var obj = format.readGeometry(str);
      expect(obj).to.be.a(_ol_geom_Polygon_);
      expect(obj.getLayout()).to.eql('XY');
      var rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0]).to.be.a(_ol_geom_LinearRing_);
      expect(rings[1]).to.be.a(_ol_geom_LinearRing_);
      expect(rings[2]).to.be.a(_ol_geom_LinearRing_);
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
      expect(geometryCollection).to.be.an(_ol_geom_GeometryCollection_);
      var array = geometryCollection.getGeometries();
      expect(array.length).to.be(2);
      expect(array[0]).to.be.a(_ol_geom_Point_);
      expect(array[0].getLayout()).to.eql('XY');
      expect(array[1]).to.be.a(_ol_geom_LineString_);
      expect(array[1].getLayout()).to.eql('XY');
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
      expect(first).to.be.a(_ol_Feature_);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(_ol_geom_Point_);

      var second = features[1];
      expect(second).to.be.a(_ol_Feature_);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(_ol_geom_LineString_);

      expect(format.readProjection(json)).to.be(_ol_proj_.get('EPSG:3857'));

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
      expect(first).to.be.a(_ol_Feature_);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(_ol_geom_Point_);

      var second = features[1];
      expect(second).to.be.a(_ol_Feature_);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(_ol_geom_LineString_);

      expect(format.readProjection(json)).to.be(_ol_proj_.get('EPSG:4326'));

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
      expect(format.readProjection(json)).to.be(_ol_proj_.get('EPSG:4326'));
    });

  });

  describe('#writeFeatures', function() {

    it('encodes feature collection', function() {
      var str = JSON.stringify(data);
      var array = format.readFeatures(str);
      var geojson = format.writeFeaturesObject(array);
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
      var str = JSON.stringify(data);
      var array = format.readFeatures(str);
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

    it('writes out a feature with a different geometryName correctly',
        function() {
          var feature = new _ol_Feature_({'foo': 'bar'});
          feature.setGeometryName('mygeom');
          feature.setGeometry(new _ol_geom_Point_([5, 10]));
          var geojson = format.writeFeaturesObject([feature]);
          expect(geojson.features[0].properties.mygeom).to.eql(undefined);
        });

    it('writes out a feature without properties correctly', function() {
      var feature = new _ol_Feature_(new _ol_geom_Point_([5, 10]));
      var geojson = format.writeFeatureObject(feature);
      expect(geojson.properties).to.eql(null);
    });

    it('writes out a feature without geometry correctly', function() {
      var feature = new _ol_Feature_();
      var geojson = format.writeFeatureObject(feature);
      expect(geojson.geometry).to.eql(null);
    });

    it('writes out a feature with id equal to 0 correctly', function() {
      var feature = new _ol_Feature_();
      feature.setId(0);
      var geojson = format.writeFeatureObject(feature);
      expect(geojson.id).to.eql(0);
    });
  });

  describe('#writeGeometry', function() {

    it('encodes point', function() {
      var point = new _ol_geom_Point_([10, 20]);
      var geojson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
          format.readGeometry(geojson).getCoordinates());
    });

    it('accepts featureProjection', function() {
      var point = new _ol_geom_Point_(_ol_proj_.fromLonLat([10, 20]));
      var geojson = format.writeGeometry(point, {featureProjection: 'EPSG:3857'});
      var obj = JSON.parse(geojson);
      expect(obj.coordinates).to.eql(_ol_proj_.toLonLat(point.getCoordinates()));
    });

    it('respects featureProjection passed to constructor', function() {
      var format = new _ol_format_GeoJSON_({featureProjection: 'EPSG:3857'});
      var point = new _ol_geom_Point_(_ol_proj_.fromLonLat([10, 20]));
      var geojson = format.writeGeometry(point);
      var obj = JSON.parse(geojson);
      expect(obj.coordinates).to.eql(_ol_proj_.toLonLat(point.getCoordinates()));
    });

    it('encodes linestring', function() {
      var linestring = new _ol_geom_LineString_([[10, 20], [30, 40]]);
      var geojson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
          format.readGeometry(geojson).getCoordinates());
    });

    it('encodes polygon', function() {
      var outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      var inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      var inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      var polygon = new _ol_geom_Polygon_([outer, inner1, inner2]);
      var geojson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates()).to.eql(
          format.readGeometry(geojson).getCoordinates());
    });

    it('maintains coordinate order by default', function() {

      var cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      var ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];

      var right = new _ol_geom_Polygon_([ccw, cw]);
      var rightMulti = new _ol_geom_MultiPolygon_([[ccw, cw]]);
      var left = new _ol_geom_Polygon_([cw, ccw]);
      var leftMulti = new _ol_geom_MultiPolygon_([[cw, ccw]]);

      var rightObj = {
        type: 'Polygon',
        coordinates: [ccw, cw]
      };

      var rightMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[ccw, cw]]
      };

      var leftObj = {
        type: 'Polygon',
        coordinates: [cw, ccw]
      };

      var leftMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[cw, ccw]]
      };

      expect(JSON.parse(format.writeGeometry(right))).to.eql(rightObj);
      expect(
          JSON.parse(format.writeGeometry(rightMulti))).to.eql(rightMultiObj);
      expect(JSON.parse(format.writeGeometry(left))).to.eql(leftObj);
      expect(JSON.parse(format.writeGeometry(leftMulti))).to.eql(leftMultiObj);

    });

    it('allows serializing following the right-hand rule', function() {

      var cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      var ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      var right = new _ol_geom_Polygon_([ccw, cw]);
      var rightMulti = new _ol_geom_MultiPolygon_([[ccw, cw]]);
      var left = new _ol_geom_Polygon_([cw, ccw]);
      var leftMulti = new _ol_geom_MultiPolygon_([[cw, ccw]]);

      var rightObj = {
        type: 'Polygon',
        coordinates: [ccw, cw]
      };

      var rightMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[ccw, cw]]
      };

      var json = format.writeGeometry(right, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightObj);
      json = format.writeGeometry(rightMulti, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightMultiObj);

      json = format.writeGeometry(left, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightObj);
      json = format.writeGeometry(leftMulti, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightMultiObj);

    });

    it('allows serializing following the left-hand rule', function() {

      var cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      var ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      var right = new _ol_geom_Polygon_([ccw, cw]);
      var rightMulti = new _ol_geom_MultiPolygon_([[ccw, cw]]);
      var left = new _ol_geom_Polygon_([cw, ccw]);
      var leftMulti = new _ol_geom_MultiPolygon_([[cw, ccw]]);

      var leftObj = {
        type: 'Polygon',
        coordinates: [cw, ccw]
      };

      var leftMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[cw, ccw]]
      };

      var json = format.writeGeometry(right, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftObj);
      json = format.writeGeometry(rightMulti, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftMultiObj);

      json = format.writeGeometry(left, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftObj);
      json = format.writeGeometry(leftMulti, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftMultiObj);

    });

    it('encodes geometry collection', function() {
      var collection = new _ol_geom_GeometryCollection_([
        new _ol_geom_Point_([10, 20]),
        new _ol_geom_LineString_([[30, 40], [50, 60]])
      ]);
      var geojson = format.writeGeometry(collection);
      var got = format.readGeometry(geojson);
      expect(got).to.be.an(_ol_geom_GeometryCollection_);
      var gotGeometries = got.getGeometries();
      var geometries = collection.getGeometries();
      expect(geometries.length).to.equal(gotGeometries.length);
      for (var i = 0, ii = geometries.length; i < ii; ++i) {
        expect(geometries[i].getCoordinates()).
            to.eql(gotGeometries[i].getCoordinates());
      }

    });

    it('encodes a circle as an empty geometry collection', function() {
      var circle = new _ol_geom_Circle_([0, 0], 1);
      var geojson = format.writeGeometryObject(circle);
      expect(geojson).to.eql({
        'type': 'GeometryCollection',
        'geometries': []
      });
    });

    it('transforms and encodes a point', function() {
      var point = new _ol_geom_Point_([2, 3]);
      var geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857'
      });
      var newPoint = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857'
      });
      expect(point.getCoordinates()[0]).to.roughlyEqual(
          newPoint.getCoordinates()[0], 1e-8);
      expect(point.getCoordinates()[1]).to.roughlyEqual(
          newPoint.getCoordinates()[1], 1e-8);
    });

    it('transforms and encodes geometry collection', function() {
      var collection = new _ol_geom_GeometryCollection_([
        new _ol_geom_Point_([2, 3]),
        new _ol_geom_LineString_([[3, 2], [2, 1]])
      ]);
      var geojson = format.writeGeometry(collection, {
        featureProjection: 'EPSG:3857'
      });
      var got = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857'
      });
      var gotGeometries = got.getGeometries();
      var geometries = collection.getGeometries();
      expect(geometries[0].getCoordinates()[0]).to.roughlyEqual(
          gotGeometries[0].getCoordinates()[0], 1e-8);
      expect(geometries[0].getCoordinates()[1]).to.roughlyEqual(
          gotGeometries[0].getCoordinates()[1], 1e-8);
      expect(geometries[1].getCoordinates()[0][0]).to.roughlyEqual(
          gotGeometries[1].getCoordinates()[0][0], 1e-8);
      expect(geometries[1].getCoordinates()[0][1]).to.roughlyEqual(
          gotGeometries[1].getCoordinates()[0][1], 1e-8);
    });

    it('truncates transformed point with decimals option', function() {
      var point = new _ol_geom_Point_([2, 3]).transform('EPSG:4326', 'EPSG:3857');
      var geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
        decimals: 2
      });
      expect(format.readGeometry(geojson).getCoordinates()).to.eql(
          [2, 3]);
    });

    it('truncates a linestring with decimals option', function() {
      var linestring = new _ol_geom_LineString_([[42.123456789, 38.987654321],
        [43, 39]]);
      var geojson = format.writeGeometry(linestring, {
        decimals: 6
      });
      expect(format.readGeometry(geojson).getCoordinates()).to.eql(
          [[42.123457, 38.987654], [43, 39]]);
      expect(linestring.getCoordinates()).to.eql(
          [[42.123456789, 38.987654321], [43, 39]]);
    });

    it('rounds a linestring with decimals option = 0', function() {
      var linestring = new _ol_geom_LineString_([[42.123456789, 38.987654321],
        [43, 39]]);
      var geojson = format.writeGeometry(linestring, {
        decimals: 0
      });
      expect(format.readGeometry(geojson).getCoordinates()).to.eql(
          [[42, 39], [43, 39]]);
      expect(linestring.getCoordinates()).to.eql(
          [[42.123456789, 38.987654321], [43, 39]]);
    });
  });

});
