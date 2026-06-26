import {assert} from 'chai';
import fse from 'fs-extra';
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
import {
  fromLonLat,
  get as getProjection,
  toLonLat,
  transform,
} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import RenderFeature from '../../../../src/ol/render/Feature.js';

class TestFeature extends Feature {}

describe('ol/format/GeoJSON.js', function () {
  let format;
  beforeEach(function () {
    format = new GeoJSON();
  });

  const pointGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [102.0, 0.5],
    },
    'properties': {
      'prop0': 'value0',
    },
  };

  const nullGeometryGeoJSON = {
    'type': 'Feature',
    'geometry': null,
    'properties': {
      'prop0': 'value0',
    },
  };

  const zeroIdGeoJSON = {
    'type': 'Feature',
    'id': 0,
    'geometry': null,
    'properties': {
      'prop0': 'value0',
    },
  };

  const lineStringGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': [
        [102.0, 0.0],
        [103.0, 1.0],
        [104.0, 0.0],
        [105.0, 1.0],
      ],
    },
    'properties': {
      'prop0': 'value0',
      'prop1': 0.0,
    },
  };

  const polygonGeoJSON = {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [
        [
          [100.0, 0.0],
          [100.0, 1.0],
          [101.0, 1.0],
          [101.0, 0.0],
        ],
      ],
    },
    'properties': {
      'prop0': 'value0',
      'prop1': {'this': 'that'},
    },
  };

  const featureCollectionGeoJSON = {
    'type': 'FeatureCollection',
    'features': [pointGeoJSON, lineStringGeoJSON, polygonGeoJSON],
  };

  const data = {
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
          'SHAPE_LEN': 46.3826,
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
            [1549506.22, 6403739.2504],
          ],
        },
      },
      {
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
          'SHAPE_LEN': 70.3106,
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [1549754.2769, 6403854.8024],
            [1549728.45985, 6403920.2],
          ],
        },
      },
    ],
  };

  describe('extractGeometryName', () => {
    it('makes it so the geometry name will be set to the value of the `geometry_name` value', () => {
      const data = {
        type: 'Feature',
        properties: {},
        geometry_name: 'the_geom',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      };
      const format = new GeoJSON({extractGeometryName: true});
      const feature = format.readFeature(data);
      assert.strictEqual(feature.getGeometryName(), 'the_geom');
      assert.instanceOf(feature.getGeometry(), Point);
      assert.deepEqual(feature.getGeometry().getCoordinates(), [0, 0]);
    });

    it('does nothing if `geometry_name` is missing', () => {
      const data = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      };
      const format = new GeoJSON({extractGeometryName: true});
      const feature = format.readFeature(data);
      assert.strictEqual(feature.getGeometryName(), 'geometry');
      assert.instanceOf(feature.getGeometry(), Point);
      assert.deepEqual(feature.getGeometry().getCoordinates(), [0, 0]);
    });
  });

  describe('#readFeature', function () {
    it('can read a single point feature', function () {
      const feature = format.readFeature(pointGeoJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Point);
      assert.deepEqual(geometry.getCoordinates(), [102.0, 0.5]);
      assert.strictEqual(feature.get('prop0'), 'value0');
    });

    it('uses the configured featureClass', function () {
      const feature = new GeoJSON({featureClass: TestFeature}).readFeature(
        pointGeoJSON,
      );
      assert.instanceOf(feature, TestFeature);
      assert.instanceOf(feature.getGeometry(), Point);
      assert.strictEqual(feature.get('prop0'), 'value0');
    });

    it('can read a single point geometry as a feature', function () {
      const feature = format.readFeature(pointGeoJSON.geometry);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Point);
      assert.deepEqual(geometry.getCoordinates(), [102.0, 0.5]);
    });

    it('can read a single line string feature', function () {
      const feature = format.readFeature(lineStringGeoJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, LineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [102.0, 0.0],
        [103.0, 1.0],
        [104.0, 0.0],
        [105.0, 1.0],
      ]);
      assert.strictEqual(feature.get('prop0'), 'value0');
      assert.strictEqual(feature.get('prop1'), 0.0);
    });

    it('can read a single polygon feature', function () {
      const feature = format.readFeature(polygonGeoJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Polygon);
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [100.0, 0.0],
          [100.0, 1.0],
          [101.0, 1.0],
          [101.0, 0.0],
        ],
      ]);
      assert.strictEqual(feature.get('prop0'), 'value0');
      assert.deepEqual(feature.get('prop1'), {'this': 'that'});
    });

    it('can read a feature with null geometry', function () {
      const feature = format.readFeature(nullGeometryGeoJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.deepEqual(geometry, null);
      assert.strictEqual(feature.get('prop0'), 'value0');
    });

    it('can read a feature with id equal to 0', function () {
      const feature = format.readFeature(zeroIdGeoJSON);
      assert.instanceOf(feature, Feature);
      assert.strictEqual(feature.getId(), 0);
    });

    it('can read a feature collection', function () {
      const features = format.readFeatures(featureCollectionGeoJSON);
      assert.lengthOf(features, 3);
      assert.instanceOf(features[0].getGeometry(), Point);
      assert.instanceOf(features[1].getGeometry(), LineString);
      assert.instanceOf(features[2].getGeometry(), Polygon);
    });

    it('can read and transform a point', function () {
      const feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857',
      });
      assert.instanceOf(feature[0].getGeometry(), Point);
      assert.deepEqual(
        feature[0].getGeometry().getCoordinates(),
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
      );
    });

    it('uses featureProjection passed to the constructor', function () {
      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const feature = format.readFeatures(pointGeoJSON);
      assert.instanceOf(feature[0].getGeometry(), Point);
      assert.deepEqual(
        feature[0].getGeometry().getCoordinates(),
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
      );
    });

    it('gives precedence to options passed to the read method', function () {
      const format = new GeoJSON({featureProjection: 'EPSG:1234'});
      const feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857',
      });
      assert.instanceOf(feature[0].getGeometry(), Point);
      assert.deepEqual(
        feature[0].getGeometry().getCoordinates(),
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
      );
    });

    it('can read and transform a feature collection', function () {
      const features = format.readFeatures(featureCollectionGeoJSON, {
        featureProjection: 'EPSG:3857',
      });
      assert.instanceOf(features[0].getGeometry(), Point);
      assert.deepEqual(
        features[0].getGeometry().getCoordinates(),
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
      );
      assert.deepEqual(features[1].getGeometry().getCoordinates(), [
        transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
      ]);
      assert.deepEqual(features[2].getGeometry().getCoordinates(), [
        [
          transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ],
      ]);
    });

    it('can create a feature with a specific geometryName', function () {
      const feature = new GeoJSON({geometryName: 'the_geom'}).readFeature(
        pointGeoJSON,
      );
      assert.strictEqual(feature.getGeometryName(), 'the_geom');
      assert.instanceOf(feature.getGeometry(), Point);
    });

    it('transforms tile pixel coordinates', function () {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [1024, 1024],
        },
      };
      const format = new GeoJSON({
        dataProjection: new Projection({
          code: '',
          units: 'tile-pixels',
          extent: [0, 0, 4096, 4096],
        }),
      });
      const feature = format.readFeature(geojson, {
        extent: [-180, -90, 180, 90],
        featureProjection: 'EPSG:3857',
      });
      assert.deepEqual(feature.getGeometry().getCoordinates(), [-135, 45]);
    });
  });

  describe('#readFeatures', function () {
    it('parses feature collection', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);

      assert.strictEqual(array.length, 2);

      const first = array[0];
      assert.instanceOf(first, Feature);
      assert.strictEqual(first.get('LINK_ID'), 573730499);
      const firstGeom = first.getGeometry();
      assert.instanceOf(firstGeom, LineString);

      const second = array[1];
      assert.instanceOf(second, Feature);
      assert.strictEqual(second.get('ST_NAME'), 'BRUNNSGATAN');
      const secondGeom = second.getGeometry();
      assert.instanceOf(secondGeom, LineString);
    });

    it('can parse a polygon geometry as an array of one feature', function () {
      const features = format.readFeatures(polygonGeoJSON);
      assert.instanceOf(features, Array);
      assert.lengthOf(features, 1);
      const geometry = features[0].getGeometry();
      assert.instanceOf(geometry, Polygon);
    });

    it('parses countries.geojson', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/GeoJSON/countries.geojson',
        {encoding: 'utf8'},
      );
      const result = format.readFeatures(text);
      assert.strictEqual(result.length, 179);

      const first = result[0];
      assert.instanceOf(first, Feature);
      assert.strictEqual(first.get('name'), 'Afghanistan');
      assert.strictEqual(first.getId(), 'AFG');
      const firstGeom = first.getGeometry();
      assert.instanceOf(firstGeom, Polygon);
      assert.strictEqual(
        equals(
          firstGeom.getExtent(),
          [60.52843, 29.318572, 75.158028, 38.486282],
        ),
        true,
      );

      const last = result[178];
      assert.instanceOf(last, Feature);
      assert.strictEqual(last.get('name'), 'Zimbabwe');
      assert.strictEqual(last.getId(), 'ZWE');
      const lastGeom = last.getGeometry();
      assert.instanceOf(lastGeom, Polygon);
      assert.strictEqual(
        equals(
          lastGeom.getExtent(),
          [25.264226, -22.271612, 32.849861, -15.507787],
        ),
        true,
      );
    });

    it('generates an array of features for Feature', function () {
      const format = new GeoJSON();
      const json = {
        type: 'Feature',
        properties: {
          bam: 'baz',
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [1, 2],
            [3, 4],
          ],
        },
      };
      const features = format.readFeatures(json);

      assert.strictEqual(features.length, 1);

      const first = features[0];
      assert.instanceOf(first, Feature);
      assert.strictEqual(first.get('bam'), 'baz');
      assert.instanceOf(first.getGeometry(), LineString);

      assert.strictEqual(
        format.readProjection(json),
        getProjection('EPSG:4326'),
      );
    });
  });

  describe('#readGeometry', function () {
    it('parses point', function () {
      const str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Point);
      assert.deepEqual(obj.getCoordinates(), [10, 20]);
      assert.deepEqual(obj.getLayout(), 'XY');
    });

    it('parses linestring', function () {
      const str = JSON.stringify({
        type: 'LineString',
        coordinates: [
          [10, 20],
          [30, 40],
        ],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, LineString);
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20],
        [30, 40],
      ]);
      assert.deepEqual(obj.getLayout(), 'XY');
    });

    it('parses XYZ linestring', function () {
      const str = JSON.stringify({
        type: 'LineString',
        coordinates: [
          [10, 20, 1534],
          [30, 40, 1420],
        ],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, LineString);
      assert.deepEqual(obj.getLayout(), 'XYZ');
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20, 1534],
        [30, 40, 1420],
      ]);
    });

    it('parses polygon', function () {
      const outer = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ];
      const inner1 = [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1],
      ];
      const inner2 = [
        [8, 8],
        [9, 8],
        [9, 9],
        [8, 9],
        [8, 8],
      ];
      const str = JSON.stringify({
        type: 'Polygon',
        coordinates: [outer, inner1, inner2],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Polygon);
      assert.deepEqual(obj.getLayout(), 'XY');
      const rings = obj.getLinearRings();
      assert.strictEqual(rings.length, 3);
      assert.instanceOf(rings[0], LinearRing);
      assert.instanceOf(rings[1], LinearRing);
      assert.instanceOf(rings[2], LinearRing);
    });

    it('parses geometry collection', function () {
      const str = JSON.stringify({
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [10, 20]},
          {
            type: 'LineString',
            coordinates: [
              [30, 40],
              [50, 60],
            ],
          },
        ],
      });

      const geometryCollection = format.readGeometry(str);
      assert.instanceOf(geometryCollection, GeometryCollection);
      const array = geometryCollection.getGeometries();
      assert.strictEqual(array.length, 2);
      assert.instanceOf(array[0], Point);
      assert.deepEqual(array[0].getLayout(), 'XY');
      assert.instanceOf(array[1], LineString);
      assert.deepEqual(array[1].getLayout(), 'XY');
    });

    it('works with empty coordinate subarrays', function () {
      const coordinates = [
        [
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [1, 2],
          ],
        ],
        [],
      ];
      const geojson = {
        type: 'MultiPolygon',
        coordinates: coordinates,
      };
      const geometry = format.readGeometry(geojson);
      assert.deepEqual(geometry.getCoordinates(), coordinates);
    });

    it('works with empty coordinate array', () => {
      const types = [
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
      ];
      types.forEach((type) => {
        const geojson = {
          type,
          coordinates: [],
        };
        const geometry = format.readGeometry(geojson);
        assert.deepEqual(geometry.getCoordinates(), []);
      });
    });

    it('works with empty coordinate array and reprojection', () => {
      const types = [
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
      ];
      types.forEach((type) => {
        const geojson = {
          type,
          coordinates: [],
        };
        const geometry = format.readGeometry(geojson, {
          featureProjection: 'EPSG:3857',
        });
        assert.deepEqual(geometry.getCoordinates(), []);
      });
    });
  });

  describe('#readProjection', function () {
    it('reads named crs from top-level object', function () {
      const json = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:3857',
          },
        },
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },
            geometry: {
              type: 'Point',
              coordinates: [1, 2],
            },
          },
          {
            type: 'Feature',
            properties: {
              bam: 'baz',
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
          },
        ],
      };
      const features = format.readFeatures(json);

      assert.strictEqual(features.length, 2);

      const first = features[0];
      assert.instanceOf(first, Feature);
      assert.strictEqual(first.get('foo'), 'bar');
      assert.instanceOf(first.getGeometry(), Point);

      const second = features[1];
      assert.instanceOf(second, Feature);
      assert.strictEqual(second.get('bam'), 'baz');
      assert.instanceOf(second.getGeometry(), LineString);

      assert.strictEqual(
        format.readProjection(json),
        getProjection('EPSG:3857'),
      );
    });

    it('accepts null crs', function () {
      const json = {
        type: 'FeatureCollection',
        crs: null,
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },
            geometry: {
              type: 'Point',
              coordinates: [1, 2],
            },
          },
          {
            type: 'Feature',
            properties: {
              bam: 'baz',
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
          },
        ],
      };
      const features = format.readFeatures(json);

      assert.strictEqual(features.length, 2);

      const first = features[0];
      assert.instanceOf(first, Feature);
      assert.strictEqual(first.get('foo'), 'bar');
      assert.instanceOf(first.getGeometry(), Point);

      const second = features[1];
      assert.instanceOf(second, Feature);
      assert.strictEqual(second.get('bam'), 'baz');
      assert.instanceOf(second.getGeometry(), LineString);

      assert.strictEqual(
        format.readProjection(json),
        getProjection('EPSG:4326'),
      );
    });
  });

  describe('#writeFeatures', function () {
    it('encodes feature collection', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const geojson = format.writeFeaturesObject(array);
      const result = format.readFeatures(geojson);
      assert.equal(array.length, result.length);
      let got, exp, gotProp, expProp;
      for (let i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        assert.deepEqual(
          got.getGeometry().getCoordinates(),
          exp.getGeometry().getCoordinates(),
        );
        gotProp = got.getProperties();
        delete gotProp.geometry;
        expProp = exp.getProperties();
        delete expProp.geometry;
        assert.deepEqual(gotProp, expProp);
      }
    });

    it('transforms and encodes feature collection', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const geojson = format.writeFeatures(array, {
        featureProjection: 'EPSG:3857',
      });
      const result = format.readFeatures(geojson);
      let got, exp;
      for (let i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        assert.deepEqual(
          got
            .getGeometry()
            .transform('EPSG:3857', 'EPSG:4326')
            .getCoordinates(),
          exp.getGeometry().getCoordinates(),
        );
      }
    });

    it('writes out a feature with a different geometryName correctly', function () {
      const feature = new Feature({'foo': 'bar'});
      feature.setGeometryName('mygeom');
      feature.setGeometry(new Point([5, 10]));
      const geojson = format.writeFeaturesObject([feature]);
      assert.deepEqual(geojson.features[0].properties.mygeom, undefined);
    });

    it('writes out a feature without properties correctly', function () {
      const feature = new Feature(new Point([5, 10]));
      const geojson = format.writeFeatureObject(feature);
      assert.deepEqual(geojson.properties, null);
      assert.deepEqual(geojson.geometry, {type: 'Point', coordinates: [5, 10]});
    });

    it('writes out a feature with only non-geometry properties correctly', function () {
      const feature = new Feature({foo: 'bar'});
      const geojson = format.writeFeatureObject(feature);
      assert.deepEqual(geojson.geometry, null);
      assert.deepEqual(geojson.properties, {foo: 'bar'});
    });

    it('writes out a feature with deleted properties correctly', function () {
      const feature = new Feature({foo: 'bar'});
      feature.unset('foo');
      const geojson = format.writeFeatureObject(feature);
      assert.deepEqual(geojson.geometry, null);
      assert.deepEqual(geojson.properties, null);
    });

    it('writes out a feature without geometry correctly', function () {
      const feature = new Feature();
      const geojson = format.writeFeatureObject(feature);
      assert.deepEqual(geojson.geometry, null);
    });

    it('writes out a feature with id equal to 0 correctly', function () {
      const feature = new Feature();
      feature.setId(0);
      const geojson = format.writeFeatureObject(feature);
      assert.deepEqual(geojson.id, 0);
    });
  });

  describe('#writeGeometry', function () {
    it('encodes point', function () {
      const point = new Point([10, 20]);
      const geojson = format.writeGeometry(point);
      assert.deepEqual(
        point.getCoordinates(),
        format.readGeometry(geojson).getCoordinates(),
      );
    });

    it('accepts featureProjection', function () {
      const point = new Point(fromLonLat([10, 20]));
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
      });
      const obj = JSON.parse(geojson);
      assert.deepEqual(obj.coordinates, toLonLat(point.getCoordinates()));
    });

    it('respects featureProjection passed to constructor', function () {
      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const point = new Point(fromLonLat([10, 20]));
      const geojson = format.writeGeometry(point);
      const obj = JSON.parse(geojson);
      assert.deepEqual(obj.coordinates, toLonLat(point.getCoordinates()));
    });

    it('encodes linestring', function () {
      const linestring = new LineString([
        [10, 20],
        [30, 40],
      ]);
      const geojson = format.writeGeometry(linestring);
      assert.deepEqual(
        linestring.getCoordinates(),
        format.readGeometry(geojson).getCoordinates(),
      );
    });

    it('encodes polygon', function () {
      const outer = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ];
      const inner1 = [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1],
      ];
      const inner2 = [
        [8, 8],
        [9, 8],
        [9, 9],
        [8, 9],
        [8, 8],
      ];
      const polygon = new Polygon([outer, inner1, inner2]);
      const geojson = format.writeGeometry(polygon);
      assert.deepEqual(
        polygon.getCoordinates(),
        format.readGeometry(geojson).getCoordinates(),
      );
    });

    it('maintains coordinate order by default', function () {
      const cw = [
        [-180, -90],
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
      ];
      const ccw = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ];

      const right = new Polygon([ccw, cw]);
      const rightMulti = new MultiPolygon([[ccw, cw]]);
      const left = new Polygon([cw, ccw]);
      const leftMulti = new MultiPolygon([[cw, ccw]]);

      const rightObj = {
        type: 'Polygon',
        coordinates: [ccw, cw],
      };

      const rightMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[ccw, cw]],
      };

      const leftObj = {
        type: 'Polygon',
        coordinates: [cw, ccw],
      };

      const leftMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[cw, ccw]],
      };

      assert.deepEqual(JSON.parse(format.writeGeometry(right)), rightObj);
      assert.deepEqual(
        JSON.parse(format.writeGeometry(rightMulti)),
        rightMultiObj,
      );
      assert.deepEqual(JSON.parse(format.writeGeometry(left)), leftObj);
      assert.deepEqual(
        JSON.parse(format.writeGeometry(leftMulti)),
        leftMultiObj,
      );
    });

    it('allows serializing following the right-hand rule', function () {
      const cw = [
        [-180, -90],
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
      ];
      const ccw = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ];
      const right = new Polygon([ccw, cw]);
      const rightMulti = new MultiPolygon([[ccw, cw]]);
      const left = new Polygon([cw, ccw]);
      const leftMulti = new MultiPolygon([[cw, ccw]]);

      const rightObj = {
        type: 'Polygon',
        coordinates: [ccw, cw],
      };

      const rightMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[ccw, cw]],
      };

      let json = format.writeGeometry(right, {rightHanded: true});
      assert.deepEqual(JSON.parse(json), rightObj);
      json = format.writeGeometry(rightMulti, {rightHanded: true});
      assert.deepEqual(JSON.parse(json), rightMultiObj);

      json = format.writeGeometry(left, {rightHanded: true});
      assert.deepEqual(JSON.parse(json), rightObj);
      json = format.writeGeometry(leftMulti, {rightHanded: true});
      assert.deepEqual(JSON.parse(json), rightMultiObj);
    });

    it('allows serializing following the left-hand rule', function () {
      const cw = [
        [-180, -90],
        [-180, 90],
        [180, 90],
        [180, -90],
        [-180, -90],
      ];
      const ccw = [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ];
      const right = new Polygon([ccw, cw]);
      const rightMulti = new MultiPolygon([[ccw, cw]]);
      const left = new Polygon([cw, ccw]);
      const leftMulti = new MultiPolygon([[cw, ccw]]);

      const leftObj = {
        type: 'Polygon',
        coordinates: [cw, ccw],
      };

      const leftMultiObj = {
        type: 'MultiPolygon',
        coordinates: [[cw, ccw]],
      };

      let json = format.writeGeometry(right, {rightHanded: false});
      assert.deepEqual(JSON.parse(json), leftObj);
      json = format.writeGeometry(rightMulti, {rightHanded: false});
      assert.deepEqual(JSON.parse(json), leftMultiObj);

      json = format.writeGeometry(left, {rightHanded: false});
      assert.deepEqual(JSON.parse(json), leftObj);
      json = format.writeGeometry(leftMulti, {rightHanded: false});
      assert.deepEqual(JSON.parse(json), leftMultiObj);
    });

    it('encodes geometry collection', function () {
      const collection = new GeometryCollection([
        new Point([10, 20]),
        new LineString([
          [30, 40],
          [50, 60],
        ]),
      ]);
      const geojson = format.writeGeometry(collection);
      const got = format.readGeometry(geojson);
      assert.instanceOf(got, GeometryCollection);
      const gotGeometries = got.getGeometries();
      const geometries = collection.getGeometries();
      assert.equal(geometries.length, gotGeometries.length);
      for (let i = 0, ii = geometries.length; i < ii; ++i) {
        assert.deepEqual(
          geometries[i].getCoordinates(),
          gotGeometries[i].getCoordinates(),
        );
      }
    });

    it('encodes a circle as an empty geometry collection', function () {
      const circle = new Circle([0, 0], 1);
      const geojson = format.writeGeometryObject(circle);
      assert.deepEqual(geojson, {
        'type': 'GeometryCollection',
        'geometries': [],
      });
    });

    it('transforms and encodes a point', function () {
      const point = new Point([2, 3]);
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
      });
      const newPoint = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857',
      });
      assert.approximately(
        point.getCoordinates()[0],
        newPoint.getCoordinates()[0],
        1e-8,
      );
      assert.approximately(
        point.getCoordinates()[1],
        newPoint.getCoordinates()[1],
        1e-8,
      );
    });

    it('transforms and encodes geometry collection', function () {
      const collection = new GeometryCollection([
        new Point([2, 3]),
        new LineString([
          [3, 2],
          [2, 1],
        ]),
      ]);
      const geojson = format.writeGeometry(collection, {
        featureProjection: 'EPSG:3857',
      });
      const got = format.readGeometry(geojson, {
        featureProjection: 'EPSG:3857',
      });
      const gotGeometries = got.getGeometries();
      const geometries = collection.getGeometries();
      assert.approximately(
        geometries[0].getCoordinates()[0],
        gotGeometries[0].getCoordinates()[0],
        1e-8,
      );
      assert.approximately(
        geometries[0].getCoordinates()[1],
        gotGeometries[0].getCoordinates()[1],
        1e-8,
      );
      assert.approximately(
        geometries[1].getCoordinates()[0][0],
        gotGeometries[1].getCoordinates()[0][0],
        1e-8,
      );
      assert.approximately(
        geometries[1].getCoordinates()[0][1],
        gotGeometries[1].getCoordinates()[0][1],
        1e-8,
      );
    });

    it('truncates transformed point with decimals option', function () {
      const point = new Point([2, 3]).transform('EPSG:4326', 'EPSG:3857');
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
        decimals: 2,
      });
      assert.deepEqual(format.readGeometry(geojson).getCoordinates(), [2, 3]);
    });

    it('truncates a linestring with decimals option', function () {
      const linestring = new LineString([
        [42.123456789, 38.987654321],
        [43, 39],
      ]);
      const geojson = format.writeGeometry(linestring, {
        decimals: 6,
      });
      assert.deepEqual(format.readGeometry(geojson).getCoordinates(), [
        [42.123457, 38.987654],
        [43, 39],
      ]);
      assert.deepEqual(linestring.getCoordinates(), [
        [42.123456789, 38.987654321],
        [43, 39],
      ]);
    });

    it('rounds a linestring with decimals option = 0', function () {
      const linestring = new LineString([
        [42.123456789, 38.987654321],
        [43, 39],
      ]);
      const geojson = format.writeGeometry(linestring, {
        decimals: 0,
      });
      assert.deepEqual(format.readGeometry(geojson).getCoordinates(), [
        [42, 39],
        [43, 39],
      ]);
      assert.deepEqual(linestring.getCoordinates(), [
        [42.123456789, 38.987654321],
        [43, 39],
      ]);
    });

    it('works with empty coordinate arrays', function () {
      const coordinates = [
        [
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [1, 2],
          ],
        ],
        [],
      ];
      const geometry = new MultiPolygon([
        new Polygon(coordinates[0]),
        new Polygon(coordinates[1]),
      ]);
      const geojson = format.writeGeometryObject(geometry);
      assert.deepEqual(geojson, {
        type: 'MultiPolygon',
        coordinates: coordinates,
      });
    });
  });
});

describe('ol/format/GeoJSON with {featureClass: RenderFeature}', function () {
  let format;
  beforeEach(function () {
    format = new GeoJSON({featureClass: RenderFeature});
  });

  describe('#readGeometry', function () {
    it('is the same as with the default', function () {
      const str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Point);
    });
  });

  describe('#readFeature', function () {
    it('creates a render feature', function () {
      const str = JSON.stringify({
        type: 'Feature',
        properties: {
          foo: 'bar',
        },
        geometry: {
          type: 'Point',
          coordinates: [10, 20, 30],
        },
      });

      const obj = format.readFeature(str);
      assert.instanceOf(obj, RenderFeature);
      assert.strictEqual(obj.getType(), 'Point');
      assert.deepEqual(obj.getFlatCoordinates(), [10, 20, 30]);
      assert.strictEqual(obj.getStride(), 3);
      assert.strictEqual(obj.get('foo'), 'bar');
    });
    it('returns an array for geometry collections', function () {
      const str = JSON.stringify({
        type: 'Feature',
        id: 1,
        properties: {
          foo: 'bar',
        },
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            {
              type: 'GeometryCollection',
              geometries: [
                {
                  type: 'Point',
                  coordinates: [1, 1],
                },
              ],
            },
            {
              type: 'Point',
              coordinates: [2, 2],
            },
          ],
        },
      });
      const obj = format.readFeature(str);
      assert.strictEqual(obj.length, 2);
      assert.instanceOf(obj[0], RenderFeature);
      assert.deepEqual(obj[0].getFlatCoordinates(), [1, 1]);
      assert.strictEqual(obj[0].getId(), 1);
      assert.strictEqual(obj[0].get('foo'), 'bar');
      assert.instanceOf(obj[1], RenderFeature);
      assert.deepEqual(obj[1].getFlatCoordinates(), [2, 2]);
      assert.strictEqual(obj[1].getId(), 1);
      assert.strictEqual(obj[1].get('foo'), 'bar');
    });
  });

  describe('#readFeatures', function () {
    it('creates render features', function () {
      const str = JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },
            geometry: {
              type: 'Point',
              coordinates: [1, 1],
            },
          },
          {
            type: 'Feature',
            properties: {
              foo: 'baz',
            },
            geometry: {
              type: 'Point',
              coordinates: [2, 2],
            },
          },
        ],
      });

      const obj = format.readFeatures(str);
      assert.strictEqual(obj.length, 2);
      assert.instanceOf(obj[0], RenderFeature);
    });
    it('returns the correct array when geometry collections are involved', function () {
      const str = JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 1,
            properties: {
              foo: 'bar',
            },
            geometry: {
              type: 'GeometryCollection',
              geometries: [
                {
                  type: 'GeometryCollection',
                  geometries: [
                    {
                      type: 'Point',
                      coordinates: [1, 1],
                    },
                  ],
                },
                {
                  type: 'Point',
                  coordinates: [2, 2],
                },
              ],
            },
          },
          {
            type: 'Feature',
            id: 2,
            geometry: {
              type: 'Point',
              coordinates: [3, 3],
            },
          },
        ],
      });
      const obj = format.readFeatures(str);
      assert.strictEqual(obj.length, 3);
      assert.strictEqual(obj[0].getId(), 1);
      assert.strictEqual(obj[2].getId(), 2);
    });
    it('ignores null geometry features', function () {
      const str = JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 1,
            properties: {
              foo: 'bar',
            },
            geometry: null,
          },
          {
            type: 'Feature',
            id: 2,
            properties: {
              foo: 'baz',
            },
            geometry: {
              type: 'Point',
              coordinates: [1, 1],
            },
          },
        ],
      });
      const obj = format.readFeatures(str);
      assert.strictEqual(obj.length, 1);
    });
  });
});
