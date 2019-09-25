import Feature from '../../../../src/ol/Feature.js';
import {equals} from '../../../../src/ol/extent.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {fromLonLat, get as getProjection, toLonLat, transform, Projection} from '../../../../src/ol/proj.js';


describe('ol.format.GeoJSON', () => {

  let format;
  beforeEach(() => {
    format = new GeoJSON();
  });

  const pointGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [102.0, 0.5]
    },
    'properties': {
      'prop0': 'value0'
    }
  };

  const nullGeometryGeoJSON = {
    'type': 'Feature',
    'geometry': null,
    'properties': {
      'prop0': 'value0'
    }
  };

  const zeroIdGeoJSON = {
    'type': 'Feature',
    'id': 0,
    'geometry': null,
    'properties': {
      'prop0': 'value0'
    }
  };

  const lineStringGeoJSON = {
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

  const polygonGeoJSON = {
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

  const featureCollectionGeoJSON = {
    'type': 'FeatureCollection',
    'features': [pointGeoJSON, lineStringGeoJSON, polygonGeoJSON]
  };

  const data = {
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

  describe('#readFeature', () => {

    test('can read a single point feature', () => {
      const feature = format.readFeature(pointGeoJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([102.0, 0.5]);
      expect(feature.get('prop0')).toBe('value0');
    });

    test('can read a single point geometry as a feature', () => {
      const feature = format.readFeature(pointGeoJSON.geometry);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([102.0, 0.5]);
    });

    test('can read a single line string feature', () => {
      const feature = format.readFeature(lineStringGeoJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]);
      expect(feature.get('prop0')).toBe('value0');
      expect(feature.get('prop1')).toBe(0.0);
    });

    test('can read a single polygon feature', () => {
      const feature = format.readFeature(polygonGeoJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);
      expect(geometry.getCoordinates()).toEqual([[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]);
      expect(feature.get('prop0')).toBe('value0');
      expect(feature.get('prop1')).toEqual({'this': 'that'});
    });

    test('can read a feature with null geometry', () => {
      const feature = format.readFeature(nullGeometryGeoJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toEqual(null);
      expect(feature.get('prop0')).toBe('value0');
    });

    test('can read a feature with id equal to 0', () => {
      const feature = format.readFeature(zeroIdGeoJSON);
      expect(feature).toBeInstanceOf(Feature);
      expect(feature.getId()).toBe(0);
    });

    test('can read a feature collection', () => {
      const features = format.readFeatures(featureCollectionGeoJSON);
      expect(features).toHaveLength(3);
      expect(features[0].getGeometry()).toBeInstanceOf(Point);
      expect(features[1].getGeometry()).toBeInstanceOf(LineString);
      expect(features[2].getGeometry()).toBeInstanceOf(Polygon);
    });

    test('can read and transform a point', () => {
      const feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature[0].getGeometry()).toBeInstanceOf(Point);
      expect(feature[0].getGeometry().getCoordinates()).toEqual(transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    test('uses featureProjection passed to the constructor', () => {
      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const feature = format.readFeatures(pointGeoJSON);
      expect(feature[0].getGeometry()).toBeInstanceOf(Point);
      expect(feature[0].getGeometry().getCoordinates()).toEqual(transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    test('gives precedence to options passed to the read method', () => {
      const format = new GeoJSON({featureProjection: 'EPSG:1234'});
      const feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(feature[0].getGeometry()).toBeInstanceOf(Point);
      expect(feature[0].getGeometry().getCoordinates()).toEqual(transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    test('can read and transform a feature collection', () => {
      const features = format.readFeatures(featureCollectionGeoJSON, {
        featureProjection: 'EPSG:3857'
      });
      expect(features[0].getGeometry()).toBeInstanceOf(Point);
      expect(features[0].getGeometry().getCoordinates()).toEqual(transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
      expect(features[1].getGeometry().getCoordinates()).toEqual([
        transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857')
      ]);
      expect(features[2].getGeometry().getCoordinates()).toEqual([[
        transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857')
      ]]);
    });

    test('can create a feature with a specific geometryName', () => {
      const feature = new GeoJSON({geometryName: 'the_geom'}).
        readFeature(pointGeoJSON);
      expect(feature.getGeometryName()).toBe('the_geom');
      expect(feature.getGeometry()).toBeInstanceOf(Point);
    });

    test('transforms tile pixel coordinates', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [1024, 1024]
        }
      };
      const format = new GeoJSON({
        dataProjection: new Projection({
          code: '',
          units: 'tile-pixels',
          extent: [0, 0, 4096, 4096]
        })
      });
      const feature = format.readFeature(geojson, {
        extent: [-180, -90, 180, 90],
        featureProjection: 'EPSG:3857'
      });
      expect(feature.getGeometry().getCoordinates()).toEqual([-135, 45]);
    });

  });

  describe('#readFeatures', () => {

    test('parses feature collection', () => {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);

      expect(array.length).toBe(2);

      const first = array[0];
      expect(first).toBeInstanceOf(Feature);
      expect(first.get('LINK_ID')).toBe(573730499);
      const firstGeom = first.getGeometry();
      expect(firstGeom).toBeInstanceOf(LineString);

      const second = array[1];
      expect(second).toBeInstanceOf(Feature);
      expect(second.get('ST_NAME')).toBe('BRUNNSGATAN');
      const secondGeom = second.getGeometry();
      expect(secondGeom).toBeInstanceOf(LineString);
    });

    test('can parse a polygon geometry as an array of one feature', () => {
      const features = format.readFeatures(polygonGeoJSON);
      expect(features).toBeInstanceOf(Array);
      expect(features).toHaveLength(1);
      const geometry = features[0].getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);
    });

    test('parses countries.geojson', done => {
      afterLoadText('spec/ol/format/geojson/countries.geojson', function(text) {
        const result = format.readFeatures(text);
        expect(result.length).toBe(179);

        const first = result[0];
        expect(first).toBeInstanceOf(Feature);
        expect(first.get('name')).toBe('Afghanistan');
        expect(first.getId()).toBe('AFG');
        const firstGeom = first.getGeometry();
        expect(firstGeom).toBeInstanceOf(Polygon);
        expect(equals(firstGeom.getExtent(),
          [60.52843, 29.318572, 75.158028, 38.486282])).toBe(true);

        const last = result[178];
        expect(last).toBeInstanceOf(Feature);
        expect(last.get('name')).toBe('Zimbabwe');
        expect(last.getId()).toBe('ZWE');
        const lastGeom = last.getGeometry();
        expect(lastGeom).toBeInstanceOf(Polygon);
        expect(equals(lastGeom.getExtent(),
          [25.264226, -22.271612, 32.849861, -15.507787])).toBe(true);
        done();
      });

    });

    test('generates an array of features for Feature', () => {

      const format = new GeoJSON();
      const json = {
        type: 'Feature',
        properties: {
          bam: 'baz'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[1, 2], [3, 4]]
        }
      };
      const features = format.readFeatures(json);

      expect(features.length).toBe(1);

      const first = features[0];
      expect(first).toBeInstanceOf(Feature);
      expect(first.get('bam')).toBe('baz');
      expect(first.getGeometry()).toBeInstanceOf(LineString);

      expect(format.readProjection(json)).toBe(getProjection('EPSG:4326'));
    });

  });

  describe('#readGeometry', () => {

    test('parses point', () => {
      const str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Point);
      expect(obj.getCoordinates()).toEqual([10, 20]);
      expect(obj.getLayout()).toEqual('XY');
    });

    test('parses linestring', () => {
      const str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20], [30, 40]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(LineString);
      expect(obj.getCoordinates()).toEqual([[10, 20], [30, 40]]);
      expect(obj.getLayout()).toEqual('XY');
    });

    test('parses XYZ linestring', () => {
      const str = JSON.stringify({
        type: 'LineString',
        coordinates: [[10, 20, 1534], [30, 40, 1420]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(LineString);
      expect(obj.getLayout()).toEqual('XYZ');
      expect(obj.getCoordinates()).toEqual([[10, 20, 1534], [30, 40, 1420]]);
    });

    test('parses polygon', () => {
      const outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      const inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      const inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      const str = JSON.stringify({
        type: 'Polygon',
        coordinates: [outer, inner1, inner2]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Polygon);
      expect(obj.getLayout()).toEqual('XY');
      const rings = obj.getLinearRings();
      expect(rings.length).toBe(3);
      expect(rings[0]).toBeInstanceOf(LinearRing);
      expect(rings[1]).toBeInstanceOf(LinearRing);
      expect(rings[2]).toBeInstanceOf(LinearRing);
    });

    test('parses geometry collection', () => {
      const str = JSON.stringify({
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [10, 20]},
          {type: 'LineString', coordinates: [[30, 40], [50, 60]]}
        ]
      });

      const geometryCollection = format.readGeometry(str);
      expect(geometryCollection).toBeInstanceOf(GeometryCollection);
      const array = geometryCollection.getGeometries();
      expect(array.length).toBe(2);
      expect(array[0]).toBeInstanceOf(Point);
      expect(array[0].getLayout()).toEqual('XY');
      expect(array[1]).toBeInstanceOf(LineString);
      expect(array[1].getLayout()).toEqual('XY');
    });

  });

  describe('#readProjection', () => {

    test('reads named crs from top-level object', () => {

      const json = {
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
      const features = format.readFeatures(json);

      expect(features.length).toBe(2);

      const first = features[0];
      expect(first).toBeInstanceOf(Feature);
      expect(first.get('foo')).toBe('bar');
      expect(first.getGeometry()).toBeInstanceOf(Point);

      const second = features[1];
      expect(second).toBeInstanceOf(Feature);
      expect(second.get('bam')).toBe('baz');
      expect(second.getGeometry()).toBeInstanceOf(LineString);

      expect(format.readProjection(json)).toBe(getProjection('EPSG:3857'));

    });

    test('accepts null crs', () => {

      const json = {
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
      const features = format.readFeatures(json);

      expect(features.length).toBe(2);

      const first = features[0];
      expect(first).toBeInstanceOf(Feature);
      expect(first.get('foo')).toBe('bar');
      expect(first.getGeometry()).toBeInstanceOf(Point);

      const second = features[1];
      expect(second).toBeInstanceOf(Feature);
      expect(second.get('bam')).toBe('baz');
      expect(second.getGeometry()).toBeInstanceOf(LineString);

      expect(format.readProjection(json)).toBe(getProjection('EPSG:4326'));

    });

  });

  describe('#writeFeatures', () => {

    test('encodes feature collection', () => {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const geojson = format.writeFeaturesObject(array);
      const result = format.readFeatures(geojson);
      expect(array.length).toBe(result.length);
      let got, exp, gotProp, expProp;
      for (let i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().getCoordinates()).toEqual(exp.getGeometry().getCoordinates());
        gotProp = got.getProperties();
        delete gotProp.geometry;
        expProp = exp.getProperties();
        delete expProp.geometry;
        expect(gotProp).toEqual(expProp);
      }
    });

    test('transforms and encodes feature collection', () => {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const geojson = format.writeFeatures(array, {
        featureProjection: 'EPSG:3857'
      });
      const result = format.readFeatures(geojson);
      let got, exp;
      for (let i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().transform('EPSG:3857', 'EPSG:4326')
          .getCoordinates()).toEqual(exp.getGeometry().getCoordinates());
      }
    });

    test(
      'writes out a feature with a different geometryName correctly',
      () => {
        const feature = new Feature({'foo': 'bar'});
        feature.setGeometryName('mygeom');
        feature.setGeometry(new Point([5, 10]));
        const geojson = format.writeFeaturesObject([feature]);
        expect(geojson.features[0].properties.mygeom).toEqual(undefined);
      }
    );

    test('writes out a feature without properties correctly', () => {
      const feature = new Feature(new Point([5, 10]));
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.properties).toEqual(null);
    });

    test('writes out a feature without geometry correctly', () => {
      const feature = new Feature();
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.geometry).toEqual(null);
    });

    test('writes out a feature with id equal to 0 correctly', () => {
      const feature = new Feature();
      feature.setId(0);
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.id).toEqual(0);
    });
  });

  describe('#writeGeometry', () => {

    test('encodes point', () => {
      const point = new Point([10, 20]);
      const geojson = format.writeGeometry(point);
      expect(point.getCoordinates()).toEqual(format.readGeometry(geojson).getCoordinates());
    });

    test('accepts featureProjection', () => {
      const point = new Point(fromLonLat([10, 20]));
      const geojson = format.writeGeometry(point, {featureProjection: 'EPSG:3857'});
      const obj = JSON.parse(geojson);
      expect(obj.coordinates).toEqual(toLonLat(point.getCoordinates()));
    });

    test('respects featureProjection passed to constructor', () => {
      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const point = new Point(fromLonLat([10, 20]));
      const geojson = format.writeGeometry(point);
      const obj = JSON.parse(geojson);
      expect(obj.coordinates).toEqual(toLonLat(point.getCoordinates()));
    });

    test('encodes linestring', () => {
      const linestring = new LineString([[10, 20], [30, 40]]);
      const geojson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).toEqual(format.readGeometry(geojson).getCoordinates());
    });

    test('encodes polygon', () => {
      const outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      const inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      const inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      const polygon = new Polygon([outer, inner1, inner2]);
      const geojson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates()).toEqual(format.readGeometry(geojson).getCoordinates());
    });

    test('maintains coordinate order by default', () => {

      const cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      const ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];

      const right = new Polygon([ccw, cw]);
      const rightMulti = new MultiPolygon([[ccw, cw]]);
      const left = new Polygon([cw, ccw]);
      const leftMulti = new MultiPolygon([[cw, ccw]]);

      const rightObj = {
        type: 'Polygon',
        coordinates: [ccw, cw]
      };

      const rightMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[ccw, cw]]
      };

      const leftObj = {
        type: 'Polygon',
        coordinates: [cw, ccw]
      };

      const leftMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[cw, ccw]]
      };

      expect(JSON.parse(format.writeGeometry(right))).toEqual(rightObj);
      expect(
        JSON.parse(format.writeGeometry(rightMulti))).toEqual(rightMultiObj);
      expect(JSON.parse(format.writeGeometry(left))).toEqual(leftObj);
      expect(JSON.parse(format.writeGeometry(leftMulti))).toEqual(leftMultiObj);

    });

    test('allows serializing following the right-hand rule', () => {

      const cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      const ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      const right = new Polygon([ccw, cw]);
      const rightMulti = new MultiPolygon([[ccw, cw]]);
      const left = new Polygon([cw, ccw]);
      const leftMulti = new MultiPolygon([[cw, ccw]]);

      const rightObj = {
        type: 'Polygon',
        coordinates: [ccw, cw]
      };

      const rightMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[ccw, cw]]
      };

      let json = format.writeGeometry(right, {rightHanded: true});
      expect(JSON.parse(json)).toEqual(rightObj);
      json = format.writeGeometry(rightMulti, {rightHanded: true});
      expect(JSON.parse(json)).toEqual(rightMultiObj);

      json = format.writeGeometry(left, {rightHanded: true});
      expect(JSON.parse(json)).toEqual(rightObj);
      json = format.writeGeometry(leftMulti, {rightHanded: true});
      expect(JSON.parse(json)).toEqual(rightMultiObj);

    });

    test('allows serializing following the left-hand rule', () => {

      const cw = [[-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90]];
      const ccw = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]];
      const right = new Polygon([ccw, cw]);
      const rightMulti = new MultiPolygon([[ccw, cw]]);
      const left = new Polygon([cw, ccw]);
      const leftMulti = new MultiPolygon([[cw, ccw]]);

      const leftObj = {
        type: 'Polygon',
        coordinates: [cw, ccw]
      };

      const leftMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[cw, ccw]]
      };

      let json = format.writeGeometry(right, {rightHanded: false});
      expect(JSON.parse(json)).toEqual(leftObj);
      json = format.writeGeometry(rightMulti, {rightHanded: false});
      expect(JSON.parse(json)).toEqual(leftMultiObj);

      json = format.writeGeometry(left, {rightHanded: false});
      expect(JSON.parse(json)).toEqual(leftObj);
      json = format.writeGeometry(leftMulti, {rightHanded: false});
      expect(JSON.parse(json)).toEqual(leftMultiObj);

    });

    test('encodes geometry collection', () => {
      const collection = new GeometryCollection([
        new Point([10, 20]),
        new LineString([[30, 40], [50, 60]])
      ]);
      const geojson = format.writeGeometry(collection);
      const got = format.readGeometry(geojson);
      expect(got).toBeInstanceOf(GeometryCollection);
      const gotGeometries = got.getGeometries();
      const geometries = collection.getGeometries();
      expect(geometries.length).toBe(gotGeometries.length);
      for (let i = 0, ii = geometries.length; i < ii; ++i) {
        expect(geometries[i].getCoordinates()).toEqual(gotGeometries[i].getCoordinates());
      }

    });

    test('encodes a circle as an empty geometry collection', () => {
      const circle = new Circle([0, 0], 1);
      const geojson = format.writeGeometryObject(circle);
      expect(geojson).toEqual({
        'type': 'GeometryCollection',
        'geometries': []
      });
    });

    test('transforms and encodes a point', () => {
      const point = new Point([2, 3]);
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857'
      });
      const newPoint = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857'
      });
      expect(point.getCoordinates()[0]).to.roughlyEqual(
        newPoint.getCoordinates()[0], 1e-8);
      expect(point.getCoordinates()[1]).to.roughlyEqual(
        newPoint.getCoordinates()[1], 1e-8);
    });

    test('transforms and encodes geometry collection', () => {
      const collection = new GeometryCollection([
        new Point([2, 3]),
        new LineString([[3, 2], [2, 1]])
      ]);
      const geojson = format.writeGeometry(collection, {
        featureProjection: 'EPSG:3857'
      });
      const got = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857'
      });
      const gotGeometries = got.getGeometries();
      const geometries = collection.getGeometries();
      expect(geometries[0].getCoordinates()[0]).to.roughlyEqual(
        gotGeometries[0].getCoordinates()[0], 1e-8);
      expect(geometries[0].getCoordinates()[1]).to.roughlyEqual(
        gotGeometries[0].getCoordinates()[1], 1e-8);
      expect(geometries[1].getCoordinates()[0][0]).to.roughlyEqual(
        gotGeometries[1].getCoordinates()[0][0], 1e-8);
      expect(geometries[1].getCoordinates()[0][1]).to.roughlyEqual(
        gotGeometries[1].getCoordinates()[0][1], 1e-8);
    });

    test('truncates transformed point with decimals option', () => {
      const point = new Point([2, 3]).transform('EPSG:4326', 'EPSG:3857');
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
        decimals: 2
      });
      expect(format.readGeometry(geojson).getCoordinates()).toEqual([2, 3]);
    });

    test('truncates a linestring with decimals option', () => {
      const linestring = new LineString([[42.123456789, 38.987654321],
        [43, 39]]);
      const geojson = format.writeGeometry(linestring, {
        decimals: 6
      });
      expect(format.readGeometry(geojson).getCoordinates()).toEqual([[42.123457, 38.987654], [43, 39]]);
      expect(linestring.getCoordinates()).toEqual([[42.123456789, 38.987654321], [43, 39]]);
    });

    test('rounds a linestring with decimals option = 0', () => {
      const linestring = new LineString([[42.123456789, 38.987654321],
        [43, 39]]);
      const geojson = format.writeGeometry(linestring, {
        decimals: 0
      });
      expect(format.readGeometry(geojson).getCoordinates()).toEqual([[42, 39], [43, 39]]);
      expect(linestring.getCoordinates()).toEqual([[42.123456789, 38.987654321], [43, 39]]);
    });
  });

});
