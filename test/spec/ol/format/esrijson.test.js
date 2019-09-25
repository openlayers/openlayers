import Feature from '../../../../src/ol/Feature.js';
import {equals} from '../../../../src/ol/extent.js';
import EsriJSON from '../../../../src/ol/format/EsriJSON.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';


describe('ol.format.EsriJSON', () => {

  let format;
  beforeEach(() => {
    format = new EsriJSON();
  });

  const pointEsriJSON = {
    geometry: {
      x: 102.0,
      y: 0.5
    },
    attributes: {
      'prop0': 'value0'
    }
  };

  const multiPointEsriJSON = {
    geometry: {
      'points': [[102.0, 0.0], [103.0, 1.0]]
    },
    attributes: {
      'prop0': 'value0'
    }
  };

  const lineStringEsriJSON = {
    geometry: {
      paths: [[
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ]]
    },
    attributes: {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  const multiLineStringEsriJSON = {
    geometry: {
      paths: [[
        [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
      ], [
        [105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]
      ]]
    },
    attributes: {
      'prop0': 'value0',
      'prop1': 0.0
    }
  };

  const polygonEsriJSON = {
    geometry: {
      rings: [[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]
    },
    attributes: {
      'prop0': 'value0',
      'prop1': {'this': 'that'}
    }
  };

  const multiPolygonEsriJSON = {
    geometry: {
      rings: [[
        [0, 1],
        [1, 4],
        [4, 3],
        [3, 0]
      ], [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3]
      ], [
        [10, 1],
        [11, 5],
        [14, 3],
        [13, 0]
      ]]
    }
  };

  const featureCollectionEsriJSON = {
    features: [pointEsriJSON, lineStringEsriJSON, polygonEsriJSON]
  };

  const data = {
    features: [{
      attributes: {
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
      geometry: {
        paths: [[
          [1549497.66985, 6403707.96],
          [1549491.1, 6403710.1],
          [1549488.03995, 6403716.7504],
          [1549488.5401, 6403724.5504],
          [1549494.37985, 6403733.54],
          [1549499.6799, 6403738.0504],
          [1549506.22, 6403739.2504]
        ]]
      }
    }, {
      attributes: {
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
      geometry: {
        paths: [[
          [1549754.2769, 6403854.8024],
          [1549728.45985, 6403920.2]
        ]]
      }
    }]
  };

  describe('#readFeature', () => {

    test('can read a single point feature', () => {
      const feature = format.readFeature(pointEsriJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(geometry.getCoordinates()).toEqual([102.0, 0.5]);
      expect(feature.get('prop0')).toBe('value0');
    });

    test('can read a single multipoint feature', () => {
      const feature = format.readFeature(multiPointEsriJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(MultiPoint);
      expect(geometry.getCoordinates()).toEqual([[102.0, 0.0], [103.0, 1.0]]);
      expect(feature.get('prop0')).toBe('value0');
    });

    test('can read a single line string feature', () => {
      const feature = format.readFeature(lineStringEsriJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(LineString);
      expect(geometry.getCoordinates()).toEqual([[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]);
      expect(feature.get('prop0')).toBe('value0');
      expect(feature.get('prop1')).toBe(0.0);
    });

    test('can read a multi line string feature', () => {
      const feature = format.readFeature(multiLineStringEsriJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(MultiLineString);
      expect(geometry.getCoordinates()).toEqual([
        [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]],
        [[105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]]
      ]);
      expect(feature.get('prop0')).toBe('value0');
      expect(feature.get('prop1')).toBe(0.0);
    });

    test('can read a single polygon feature', () => {
      const feature = format.readFeature(polygonEsriJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);
      expect(geometry.getCoordinates()).toEqual([[
        [100.0, 0.0], [100.0, 1.0], [101.0, 1.0], [101.0, 0.0]
      ]]);
      expect(feature.get('prop0')).toBe('value0');
      expect(feature.get('prop1')).toEqual({'this': 'that'});
    });

    test('can read a multi polygon feature', () => {
      const feature = format.readFeature(multiPolygonEsriJSON);
      expect(feature).toBeInstanceOf(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(MultiPolygon);
      expect(geometry.getCoordinates()).toEqual([
        [[[0, 1], [1, 4], [4, 3], [3, 0]], [[2, 2], [3, 2], [3, 3], [2, 3]]],
        [[[10, 1], [11, 5], [14, 3], [13, 0]]]
      ]);
    });

    test('can read a feature collection', () => {
      const features = format.readFeatures(featureCollectionEsriJSON);
      expect(features).toHaveLength(3);
      expect(features[0].getGeometry()).toBeInstanceOf(Point);
      expect(features[1].getGeometry()).toBeInstanceOf(LineString);
      expect(features[2].getGeometry()).toBeInstanceOf(Polygon);
    });

    test('can read and transform a point', () => {
      const feature = format.readFeatures(pointEsriJSON, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      });
      expect(feature[0].getGeometry()).toBeInstanceOf(Point);
      expect(feature[0].getGeometry().getCoordinates()).toEqual(transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));
    });

    test('can read and transform a feature collection', () => {
      const features = format.readFeatures(featureCollectionEsriJSON, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
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
      const feature = new EsriJSON({geometryName: 'the_geom'}).
        readFeature(pointEsriJSON);
      expect(feature.getGeometryName()).toBe('the_geom');
      expect(feature.getGeometry()).toBeInstanceOf(Point);
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

    test('parses ksfields.geojson', done => {
      afterLoadText('spec/ol/format/esrijson/ksfields.json', function(text) {
        const result = format.readFeatures(text);
        expect(result.length).toBe(9);

        const first = result[0];
        expect(first).toBeInstanceOf(Feature);
        expect(first.get('field_name')).toBe('EUDORA');
        expect(first.getId()).toBe(6406);
        const firstGeom = first.getGeometry();
        expect(firstGeom).toBeInstanceOf(Polygon);
        expect(equals(firstGeom.getExtent(), [
          -10585772.743554419, 4712365.161160459,
          -10579560.16462974, 4716567.373073828
        ])).toBe(true);

        const last = result[8];
        expect(last).toBeInstanceOf(Feature);
        expect(last.get('field_name')).toBe('FEAGINS');
        expect(last.getId()).toBe(6030);
        const lastGeom = last.getGeometry();
        expect(lastGeom).toBeInstanceOf(Polygon);
        expect(equals(lastGeom.getExtent(), [
          -10555714.026858449, 4576511.565880965,
          -10553671.199322715, 4578554.9934867555
        ])).toBe(true);
        done();
      });

    });

  });

  describe('#readGeometry', () => {

    test('parses point', () => {
      const str = JSON.stringify({
        x: 10,
        y: 20
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Point);
      expect(obj.getCoordinates()).toEqual([10, 20]);
      expect(obj.getLayout()).toEqual('XY');
    });

    test('parses XYZ point', () => {
      const str = JSON.stringify({
        x: 10,
        y: 20,
        z: 10
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Point);
      expect(obj.getCoordinates()).toEqual([10, 20, 10]);
      expect(obj.getLayout()).toEqual('XYZ');
    });

    test('parses XYM point', () => {
      const str = JSON.stringify({
        x: 10,
        y: 20,
        m: 10
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Point);
      expect(obj.getCoordinates()).toEqual([10, 20, 10]);
      expect(obj.getLayout()).toEqual('XYM');
    });

    test('parses XYZM point', () => {
      const str = JSON.stringify({
        x: 10,
        y: 20,
        z: 0,
        m: 10
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Point);
      expect(obj.getCoordinates()).toEqual([10, 20, 0, 10]);
      expect(obj.getLayout()).toEqual('XYZM');
    });

    test('parses multipoint', () => {
      const str = JSON.stringify({
        points: [[10, 20], [20, 30]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPoint);
      expect(obj.getCoordinates()).toEqual([[10, 20], [20, 30]]);
      expect(obj.getLayout()).toEqual('XY');
    });

    test('parses XYZ multipoint', () => {
      const str = JSON.stringify({
        points: [[10, 20, 0], [20, 30, 0]],
        hasZ: true
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPoint);
      expect(obj.getCoordinates()).toEqual([[10, 20, 0], [20, 30, 0]]);
      expect(obj.getLayout()).toEqual('XYZ');
    });

    test('parses XYM multipoint', () => {
      const str = JSON.stringify({
        points: [[10, 20, 0], [20, 30, 0]],
        hasM: true
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPoint);
      expect(obj.getCoordinates()).toEqual([[10, 20, 0], [20, 30, 0]]);
      expect(obj.getLayout()).toEqual('XYM');
    });

    test('parses XYZM multipoint', () => {
      const str = JSON.stringify({
        points: [[10, 20, 0, 1], [20, 30, 0, 1]],
        hasZ: true,
        hasM: true
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPoint);
      expect(obj.getCoordinates()).toEqual([[10, 20, 0, 1], [20, 30, 0, 1]]);
      expect(obj.getLayout()).toEqual('XYZM');
    });

    test('parses linestring', () => {
      const str = JSON.stringify({
        paths: [[[10, 20], [30, 40]]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(LineString);
      expect(obj.getCoordinates()).toEqual([[10, 20], [30, 40]]);
      expect(obj.getLayout()).toEqual('XY');
    });

    test('parses XYZ linestring', () => {
      const str = JSON.stringify({
        hasZ: true,
        paths: [[[10, 20, 1534], [30, 40, 1420]]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(LineString);
      expect(obj.getLayout()).toEqual('XYZ');
      expect(obj.getCoordinates()).toEqual([[10, 20, 1534], [30, 40, 1420]]);
    });

    test('parses XYM linestring', () => {
      const str = JSON.stringify({
        hasM: true,
        paths: [[[10, 20, 1534], [30, 40, 1420]]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(LineString);
      expect(obj.getLayout()).toEqual('XYM');
      expect(obj.getCoordinates()).toEqual([[10, 20, 1534], [30, 40, 1420]]);
    });

    test('parses XYZM linestring', () => {
      const str = JSON.stringify({
        hasZ: true,
        hasM: true,
        paths: [[[10, 20, 1534, 1], [30, 40, 1420, 2]]]
      });

      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(LineString);
      expect(obj.getLayout()).toEqual('XYZM');
      expect(obj.getCoordinates()).toEqual([[10, 20, 1534, 1],
        [30, 40, 1420, 2]]);
    });

    test('parses multilinestring', () => {
      const str = JSON.stringify({
        paths: [[
          [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
        ], [
          [105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]
        ]]
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiLineString);
      expect(obj.getCoordinates()).toEqual([
        [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]],
        [[105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]]
      ]);
      expect(obj.getLayout()).toEqual('XY');
    });

    test('parses XYZ multilinestring', () => {
      const str = JSON.stringify({
        hasZ: true,
        paths: [[
          [102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]
        ], [
          [105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]
        ]]
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiLineString);
      expect(obj.getCoordinates()).toEqual([
        [[102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]],
        [[105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]]
      ]);
      expect(obj.getLayout()).toEqual('XYZ');
    });

    test('parses XYM multilinestring', () => {
      const str = JSON.stringify({
        hasM: true,
        paths: [[
          [102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]
        ], [
          [105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]
        ]]
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiLineString);
      expect(obj.getCoordinates()).toEqual([
        [[102.0, 0.0, 1], [103.0, 1.0, 1], [104.0, 0.0, 1], [105.0, 1.0, 1]],
        [[105.0, 3.0, 1], [106.0, 4.0, 1], [107.0, 3.0, 1], [108.0, 4.0, 1]]
      ]);
      expect(obj.getLayout()).toEqual('XYM');
    });

    test('parses XYZM multilinestring', () => {
      const str = JSON.stringify({
        hasM: true,
        hasZ: true,
        paths: [[
          [102, 0, 1, 2], [103, 1, 1, 2], [104, 0, 1, 2], [105, 1, 1, 2]
        ], [
          [105, 3, 1, 2], [106, 4, 1, 2], [107, 3, 1, 2], [108, 4, 1, 2]
        ]]
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiLineString);
      expect(obj.getCoordinates()).toEqual([
        [[102, 0, 1, 2], [103, 1, 1, 2], [104, 0, 1, 2], [105, 1, 1, 2]],
        [[105, 3, 1, 2], [106, 4, 1, 2], [107, 3, 1, 2], [108, 4, 1, 2]]
      ]);
      expect(obj.getLayout()).toEqual('XYZM');
    });

    test('parses polygon', () => {
      const outer = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
      const inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      const inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2]
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Polygon);
      expect(obj.getLayout()).toEqual('XY');
      const rings = obj.getLinearRings();
      expect(rings.length).toBe(3);
      expect(rings[0].getCoordinates()[0].length).toBe(2);
      expect(rings[0]).toBeInstanceOf(LinearRing);
      expect(rings[1]).toBeInstanceOf(LinearRing);
      expect(rings[2]).toBeInstanceOf(LinearRing);
    });

    test('parses XYZ polygon', () => {
      const outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      const inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      const inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasZ: true
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Polygon);
      expect(obj.getLayout()).toEqual('XYZ');
      const rings = obj.getLinearRings();
      expect(rings.length).toBe(3);
      expect(rings[0].getCoordinates()[0].length).toBe(3);
      expect(rings[0]).toBeInstanceOf(LinearRing);
      expect(rings[1]).toBeInstanceOf(LinearRing);
      expect(rings[2]).toBeInstanceOf(LinearRing);
    });

    test('parses XYM polygon', () => {
      const outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      const inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      const inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasM: true
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Polygon);
      expect(obj.getLayout()).toEqual('XYM');
      const rings = obj.getLinearRings();
      expect(rings.length).toBe(3);
      expect(rings[0].getCoordinates()[0].length).toBe(3);
      expect(rings[0]).toBeInstanceOf(LinearRing);
      expect(rings[1]).toBeInstanceOf(LinearRing);
      expect(rings[2]).toBeInstanceOf(LinearRing);
    });

    test('parses XYZM polygon', () => {
      const outer = [
        [0, 0, 5, 1], [0, 10, 5, 1], [10, 10, 5, 1],
        [10, 0, 5, 1], [0, 0, 5, 1]
      ];
      const inner1 = [
        [1, 1, 3, 2], [2, 1, 3, 2], [2, 2, 3, 2],
        [1, 2, 3, 2], [1, 1, 3, 2]
      ];
      const inner2 = [
        [8, 8, 2, 1], [9, 8, 2, 1], [9, 9, 2, 1],
        [8, 9, 2, 1], [8, 8, 2, 1]
      ];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasZ: true,
        hasM: true
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(Polygon);
      expect(obj.getLayout()).toEqual('XYZM');
      const rings = obj.getLinearRings();
      expect(rings.length).toBe(3);
      expect(rings[0].getCoordinates()[0].length).toBe(4);
      expect(rings[0]).toBeInstanceOf(LinearRing);
      expect(rings[1]).toBeInstanceOf(LinearRing);
      expect(rings[2]).toBeInstanceOf(LinearRing);
    });

    test('parses XY multipolygon', () => {
      const str = JSON.stringify({
        rings: [
          [[0, 1], [1, 4], [4, 3], [3, 0]],
          [[2, 2], [3, 2], [3, 3], [2, 3]],
          [[10, 1], [11, 5], [14, 3], [13, 0]]
        ]
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPolygon);
      expect(obj.getLayout()).toEqual('XY');
      expect(obj.getCoordinates()).toEqual([
        [[[0, 1], [1, 4], [4, 3], [3, 0]], [[2, 2], [3, 2],
          [3, 3], [2, 3]]],
        [[[10, 1], [11, 5], [14, 3], [13, 0]]]
      ]);
    });

    test('parses XYZ multipolygon', () => {
      const str = JSON.stringify({
        rings: [
          [[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]],
          [[2, 2, 0], [3, 2, 0], [3, 3, 0], [2, 3, 0]],
          [[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]
        ],
        hasZ: true
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPolygon);
      expect(obj.getLayout()).toEqual('XYZ');
      expect(obj.getCoordinates()).toEqual([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
          [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ]);
    });

    test('parses XYM multipolygon', () => {
      const str = JSON.stringify({
        rings: [
          [[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]],
          [[2, 2, 0], [3, 2, 0], [3, 3, 0], [2, 3, 0]],
          [[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]
        ],
        hasM: true
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPolygon);
      expect(obj.getLayout()).toEqual('XYM');
      expect(obj.getCoordinates()).toEqual([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
          [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ]);
    });

    test('parses XYZM multipolygon', () => {
      const str = JSON.stringify({
        rings: [
          [[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 1], [3, 0, 0, 1]],
          [[2, 2, 0, 1], [3, 2, 0, 1], [3, 3, 0, 1], [2, 3, 0, 1]],
          [[10, 1, 0, 1], [11, 5, 0, 1], [14, 3, 0, 1], [13, 0, 0, 1]]
        ],
        hasZ: true,
        hasM: true
      });
      const obj = format.readGeometry(str);
      expect(obj).toBeInstanceOf(MultiPolygon);
      expect(obj.getLayout()).toEqual('XYZM');
      expect(obj.getCoordinates()).toEqual([
        [[[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 1], [3, 0, 0, 1]],
          [[2, 2, 0, 1], [3, 2, 0, 1],
            [3, 3, 0, 1], [2, 3, 0, 1]]],
        [[[10, 1, 0, 1], [11, 5, 0, 1], [14, 3, 0, 1], [13, 0, 0, 1]]]
      ]);
    });

    test('should not mutate input', () => {
      const input = {
        rings: [
          [[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 1], [3, 0, 0, 1]],
          [[2, 2, 0, 1], [3, 2, 0, 1], [3, 3, 0, 1], [2, 3, 0, 1]],
          [[10, 1, 0, 1], [11, 5, 0, 1], [14, 3, 0, 1], [13, 0, 0, 1]]
        ],
        hasZ: true,
        hasM: true
      };
      const str = JSON.stringify(input);
      const obj = format.readGeometry(input);

      expect(obj).toBeInstanceOf(MultiPolygon);
      expect(str).toEqual(JSON.stringify(input));
    });

  });

  describe('#readProjection', () => {

    test('reads named crs from top-level object', () => {

      const json = {
        spatialReference: {
          wkid: 3857
        },
        features: [{
          attributes: {
            foo: 'bar'
          },
          geometry: {
            x: 1,
            y: 2
          }
        }, {
          attributes: {
            bam: 'baz'
          },
          geometry: {
            paths: [[[1, 2], [3, 4]]]
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

  });

  describe('#writeGeometry', () => {

    test('encodes point', () => {
      const point = new Point([10, 20]);
      const esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZ point', () => {
      const point = new Point([10, 20, 0], 'XYZ');
      const esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYM point', () => {
      const point = new Point([10, 20, 0], 'XYM');
      const esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZM point', () => {
      const point = new Point([10, 20, 5, 0],
        'XYZM');
      const esrijson = format.writeGeometry(point);
      expect(point.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes linestring', () => {
      const linestring = new LineString([[10, 20], [30, 40]]);
      const esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZ linestring', () => {
      const linestring = new LineString([[10, 20, 1534], [30, 40, 1420]],
        'XYZ');
      const esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYM linestring', () => {
      const linestring = new LineString([[10, 20, 1534], [30, 40, 1420]],
        'XYM');
      const esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZM linestring', () => {
      const linestring = new LineString([[10, 20, 1534, 1],
        [30, 40, 1420, 1]],
      'XYZM');
      const esrijson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes polygon', () => {
      const outer = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
      const inner1 = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
      const inner2 = [[8, 8], [9, 8], [9, 9], [8, 9], [8, 8]];
      const polygon = new Polygon([outer, inner1, inner2]);
      const esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZ polygon', () => {
      const outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      const inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      const inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      const polygon = new Polygon([outer, inner1, inner2],
        'XYZ');
      const esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYM polygon', () => {
      const outer = [[0, 0, 5], [0, 10, 5], [10, 10, 5], [10, 0, 5], [0, 0, 5]];
      const inner1 = [[1, 1, 3], [2, 1, 3], [2, 2, 3], [1, 2, 3], [1, 1, 3]];
      const inner2 = [[8, 8, 2], [9, 8, 2], [9, 9, 2], [8, 9, 2], [8, 8, 2]];
      const polygon = new Polygon([outer, inner1, inner2],
        'XYM');
      const esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZM polygon', () => {
      const outer = [
        [0, 0, 5, 1], [0, 10, 5, 2], [10, 10, 5, 1], [10, 0, 5, 1], [0, 0, 5, 1]
      ];
      const inner1 = [
        [1, 1, 3, 1], [2, 1, 3, 2], [2, 2, 3, 1], [1, 2, 3, 1], [1, 1, 3, 1]
      ];
      const inner2 = [
        [8, 8, 2, 1], [9, 8, 2, 2], [9, 9, 2, 1], [8, 9, 2, 1], [8, 8, 2, 1]
      ];
      const polygon = new Polygon([outer, inner1, inner2],
        'XYZM');
      const esrijson = format.writeGeometry(polygon);
      expect(polygon.getCoordinates(false)).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes multipoint', () => {
      const multipoint = new MultiPoint([[102.0, 0.0], [103.0, 1.0]]);
      const esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZ multipoint', () => {
      const multipoint = new MultiPoint([[102.0, 0.0, 3],
        [103.0, 1.0, 4]], 'XYZ');
      const esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYM multipoint', () => {
      const multipoint = new MultiPoint([[102.0, 0.0, 3],
        [103.0, 1.0, 4]], 'XYM');
      const esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZM multipoint', () => {
      const multipoint = new MultiPoint([[102.0, 0.0, 3, 1],
        [103.0, 1.0, 4, 1]], 'XYZM');
      const esrijson = format.writeGeometry(multipoint);
      expect(multipoint.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes multilinestring', () => {
      const multilinestring = new MultiLineString([
        [[102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]],
        [[105.0, 3.0], [106.0, 4.0], [107.0, 3.0], [108.0, 4.0]]
      ]);
      const esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZ multilinestring', () => {
      const multilinestring = new MultiLineString([
        [[102.0, 0.0, 1], [103.0, 1.0, 2], [104.0, 0.0, 3], [105.0, 1.0, 4]],
        [[105.0, 3.0, 1], [106.0, 4.0, 2], [107.0, 3.0, 3], [108.0, 4.0, 4]]
      ], 'XYZ');
      const esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYM multilinestring', () => {
      const multilinestring = new MultiLineString([
        [[102.0, 0.0, 1], [103.0, 1.0, 2], [104.0, 0.0, 3], [105.0, 1.0, 4]],
        [[105.0, 3.0, 1], [106.0, 4.0, 2], [107.0, 3.0, 3], [108.0, 4.0, 4]]
      ], 'XYM');
      const esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZM multilinestring', () => {
      const multilinestring = new MultiLineString([
        [[102.0, 0.0, 1, 0], [103.0, 1.0, 2, 2], [104.0, 0.0, 3, 1],
          [105.0, 1.0, 4, 2]],
        [[105.0, 3.0, 1, 0], [106.0, 4.0, 2, 1], [107.0, 3.0, 3, 1],
          [108.0, 4.0, 4, 2]]
      ], 'XYZM');
      const esrijson = format.writeGeometry(multilinestring);
      expect(multilinestring.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes multipolygon', () => {
      const multipolygon = new MultiPolygon([
        [[[0, 1], [1, 4], [4, 3], [3, 0]], [[2, 2], [3, 2], [3, 3], [2, 3]]],
        [[[10, 1], [11, 5], [14, 3], [13, 0]]]
      ]);
      const esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZ multipolygon', () => {
      const multipolygon = new MultiPolygon([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
          [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ], 'XYZ');
      const esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYM multipolygon', () => {
      const multipolygon = new MultiPolygon([
        [[[0, 1, 0], [1, 4, 0], [4, 3, 0], [3, 0, 0]], [[2, 2, 0], [3, 2, 0],
          [3, 3, 0], [2, 3, 0]]],
        [[[10, 1, 0], [11, 5, 0], [14, 3, 0], [13, 0, 0]]]
      ], 'XYM');
      const esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('encodes XYZM multipolygon', () => {
      const multipolygon = new MultiPolygon([
        [[[0, 1, 0, 1], [1, 4, 0, 1], [4, 3, 0, 3], [3, 0, 0, 3]],
          [[2, 2, 0, 3], [3, 2, 0, 4],
            [3, 3, 0, 1], [2, 3, 0, 1]]],
        [[[10, 1, 0, 1], [11, 5, 0, 2], [14, 3, 0, 3], [13, 0, 0, 3]]]
      ], 'XYZM');
      const esrijson = format.writeGeometry(multipolygon);
      expect(multipolygon.getCoordinates()).toEqual(format.readGeometry(esrijson).getCoordinates());
    });

    test('transforms and encodes a point', () => {
      const point = new Point([2, 3]);
      const esrijson = format.writeGeometry(point, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      const newPoint = format.readGeometry(esrijson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });
      expect(point.getCoordinates()[0]).to.roughlyEqual(
        newPoint.getCoordinates()[0], 1e-8);
      expect(
        Math.abs(point.getCoordinates()[1] - newPoint.getCoordinates()[1])).toBeLessThan(0.0000001);
    });

  });

  describe('#writeFeatures', () => {

    test('encodes feature collection', () => {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const esrijson = format.writeFeaturesObject(array);
      const result = format.readFeatures(esrijson);
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
      const esrijson = format.writeFeatures(array, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      });
      const result = format.readFeatures(esrijson);
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
        const esrijson = format.writeFeaturesObject([feature]);
        expect(esrijson.features[0].attributes.mygeom).toEqual(undefined);
      }
    );

    test('writes out a feature without properties correctly', () => {
      const feature = new Feature(new Point([5, 10]));
      const esrijson = format.writeFeatureObject(feature);
      expect(esrijson.attributes).toEqual({});
    });

    test('adds the projection inside the geometry correctly', () => {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const esrijson = format.writeFeaturesObject(array, {
        featureProjection: 'EPSG:4326'
      });
      esrijson.features.forEach(function(feature) {
        const spatialReference = feature.geometry.spatialReference;
        expect(Number(spatialReference.wkid)).toBe(4326);
      });
    });

  });

});
