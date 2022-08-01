import Circle from '../../../../src/ol/geom/Circle.js';
import Feature from '../../../../src/ol/Feature.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import GeometryCollection from '../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../src/ol/geom/LinearRing.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import expect from '../../expect.js';
import fse from 'fs-extra';
import {
  Projection,
  fromLonLat,
  get as getProjection,
  toLonLat,
  transform,
} from '../../../../src/ol/proj.js';
import {equals} from '../../../../src/ol/extent.js';

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

  describe('#readFeature', function () {
    it('can read a single point feature', function () {
      const feature = format.readFeature(pointGeoJSON);
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(Point);
      expect(geometry.getCoordinates()).to.eql([102.0, 0.5]);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a single point geometry as a feature', function () {
      const feature = format.readFeature(pointGeoJSON.geometry);
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(Point);
      expect(geometry.getCoordinates()).to.eql([102.0, 0.5]);
    });

    it('can read a single line string feature', function () {
      const feature = format.readFeature(lineStringGeoJSON);
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(LineString);
      expect(geometry.getCoordinates()).to.eql([
        [102.0, 0.0],
        [103.0, 1.0],
        [104.0, 0.0],
        [105.0, 1.0],
      ]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.be(0.0);
    });

    it('can read a single polygon feature', function () {
      const feature = format.readFeature(polygonGeoJSON);
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.be.an(Polygon);
      expect(geometry.getCoordinates()).to.eql([
        [
          [100.0, 0.0],
          [100.0, 1.0],
          [101.0, 1.0],
          [101.0, 0.0],
        ],
      ]);
      expect(feature.get('prop0')).to.be('value0');
      expect(feature.get('prop1')).to.eql({'this': 'that'});
    });

    it('can read a feature with null geometry', function () {
      const feature = format.readFeature(nullGeometryGeoJSON);
      expect(feature).to.be.an(Feature);
      const geometry = feature.getGeometry();
      expect(geometry).to.eql(null);
      expect(feature.get('prop0')).to.be('value0');
    });

    it('can read a feature with id equal to 0', function () {
      const feature = format.readFeature(zeroIdGeoJSON);
      expect(feature).to.be.an(Feature);
      expect(feature.getId()).to.be(0);
    });

    it('can read a feature collection', function () {
      const features = format.readFeatures(featureCollectionGeoJSON);
      expect(features).to.have.length(3);
      expect(features[0].getGeometry()).to.be.an(Point);
      expect(features[1].getGeometry()).to.be.an(LineString);
      expect(features[2].getGeometry()).to.be.an(Polygon);
    });

    it('can read and transform a point', function () {
      const feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857',
      });
      expect(feature[0].getGeometry()).to.be.an(Point);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857')
      );
    });

    it('uses featureProjection passed to the constructor', function () {
      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const feature = format.readFeatures(pointGeoJSON);
      expect(feature[0].getGeometry()).to.be.an(Point);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857')
      );
    });

    it('gives precedence to options passed to the read method', function () {
      const format = new GeoJSON({featureProjection: 'EPSG:1234'});
      const feature = format.readFeatures(pointGeoJSON, {
        featureProjection: 'EPSG:3857',
      });
      expect(feature[0].getGeometry()).to.be.an(Point);
      expect(feature[0].getGeometry().getCoordinates()).to.eql(
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857')
      );
    });

    it('can read and transform a feature collection', function () {
      const features = format.readFeatures(featureCollectionGeoJSON, {
        featureProjection: 'EPSG:3857',
      });
      expect(features[0].getGeometry()).to.be.an(Point);
      expect(features[0].getGeometry().getCoordinates()).to.eql(
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857')
      );
      expect(features[1].getGeometry().getCoordinates()).to.eql([
        transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
      ]);
      expect(features[2].getGeometry().getCoordinates()).to.eql([
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
        pointGeoJSON
      );
      expect(feature.getGeometryName()).to.be('the_geom');
      expect(feature.getGeometry()).to.be.an(Point);
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
      expect(feature.getGeometry().getCoordinates()).to.eql([-135, 45]);
    });
  });

  describe('#readFeatures', function () {
    it('parses feature collection', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);

      expect(array.length).to.be(2);

      const first = array[0];
      expect(first).to.be.a(Feature);
      expect(first.get('LINK_ID')).to.be(573730499);
      const firstGeom = first.getGeometry();
      expect(firstGeom).to.be.a(LineString);

      const second = array[1];
      expect(second).to.be.a(Feature);
      expect(second.get('ST_NAME')).to.be('BRUNNSGATAN');
      const secondGeom = second.getGeometry();
      expect(secondGeom).to.be.a(LineString);
    });

    it('can parse a polygon geometry as an array of one feature', function () {
      const features = format.readFeatures(polygonGeoJSON);
      expect(features).to.be.an(Array);
      expect(features).to.have.length(1);
      const geometry = features[0].getGeometry();
      expect(geometry).to.be.an(Polygon);
    });

    it('parses countries.geojson', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/GeoJSON/countries.geojson',
        {encoding: 'utf8'}
      );
      const result = format.readFeatures(text);
      expect(result.length).to.be(179);

      const first = result[0];
      expect(first).to.be.a(Feature);
      expect(first.get('name')).to.be('Afghanistan');
      expect(first.getId()).to.be('AFG');
      const firstGeom = first.getGeometry();
      expect(firstGeom).to.be.a(Polygon);
      expect(
        equals(
          firstGeom.getExtent(),
          [60.52843, 29.318572, 75.158028, 38.486282]
        )
      ).to.be(true);

      const last = result[178];
      expect(last).to.be.a(Feature);
      expect(last.get('name')).to.be('Zimbabwe');
      expect(last.getId()).to.be('ZWE');
      const lastGeom = last.getGeometry();
      expect(lastGeom).to.be.a(Polygon);
      expect(
        equals(
          lastGeom.getExtent(),
          [25.264226, -22.271612, 32.849861, -15.507787]
        )
      ).to.be(true);
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

      expect(features.length).to.be(1);

      const first = features[0];
      expect(first).to.be.a(Feature);
      expect(first.get('bam')).to.be('baz');
      expect(first.getGeometry()).to.be.a(LineString);

      expect(format.readProjection(json)).to.be(getProjection('EPSG:4326'));
    });
  });

  describe('#readGeometry', function () {
    it('parses point', function () {
      const str = JSON.stringify({
        type: 'Point',
        coordinates: [10, 20],
      });

      const obj = format.readGeometry(str);
      expect(obj).to.be.a(Point);
      expect(obj.getCoordinates()).to.eql([10, 20]);
      expect(obj.getLayout()).to.eql('XY');
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
      expect(obj).to.be.a(LineString);
      expect(obj.getCoordinates()).to.eql([
        [10, 20],
        [30, 40],
      ]);
      expect(obj.getLayout()).to.eql('XY');
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
      expect(obj).to.be.a(LineString);
      expect(obj.getLayout()).to.eql('XYZ');
      expect(obj.getCoordinates()).to.eql([
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
      expect(obj).to.be.a(Polygon);
      expect(obj.getLayout()).to.eql('XY');
      const rings = obj.getLinearRings();
      expect(rings.length).to.be(3);
      expect(rings[0]).to.be.a(LinearRing);
      expect(rings[1]).to.be.a(LinearRing);
      expect(rings[2]).to.be.a(LinearRing);
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
      expect(geometryCollection).to.be.an(GeometryCollection);
      const array = geometryCollection.getGeometries();
      expect(array.length).to.be(2);
      expect(array[0]).to.be.a(Point);
      expect(array[0].getLayout()).to.eql('XY');
      expect(array[1]).to.be.a(LineString);
      expect(array[1].getLayout()).to.eql('XY');
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
      const geojson = {
        type: 'MultiPolygon',
        coordinates: coordinates,
      };
      const geometry = format.readGeometry(geojson);
      expect(geometry.getCoordinates()).to.eql(coordinates);
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

      expect(features.length).to.be(2);

      const first = features[0];
      expect(first).to.be.a(Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(Point);

      const second = features[1];
      expect(second).to.be.a(Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(LineString);

      expect(format.readProjection(json)).to.be(getProjection('EPSG:3857'));
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

      expect(features.length).to.be(2);

      const first = features[0];
      expect(first).to.be.a(Feature);
      expect(first.get('foo')).to.be('bar');
      expect(first.getGeometry()).to.be.a(Point);

      const second = features[1];
      expect(second).to.be.a(Feature);
      expect(second.get('bam')).to.be('baz');
      expect(second.getGeometry()).to.be.a(LineString);

      expect(format.readProjection(json)).to.be(getProjection('EPSG:4326'));
    });
  });

  describe('#writeFeatures', function () {
    it('encodes feature collection', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const geojson = format.writeFeaturesObject(array);
      const result = format.readFeatures(geojson);
      expect(array.length).to.equal(result.length);
      let got, exp, gotProp, expProp;
      for (let i = 0, ii = array.length; i < ii; ++i) {
        got = array[i];
        exp = result[i];
        expect(got.getGeometry().getCoordinates()).to.eql(
          exp.getGeometry().getCoordinates()
        );
        gotProp = got.getProperties();
        delete gotProp.geometry;
        expProp = exp.getProperties();
        delete expProp.geometry;
        expect(gotProp).to.eql(expProp);
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
        expect(
          got.getGeometry().transform('EPSG:3857', 'EPSG:4326').getCoordinates()
        ).to.eql(exp.getGeometry().getCoordinates());
      }
    });

    it('writes out a feature with a different geometryName correctly', function () {
      const feature = new Feature({'foo': 'bar'});
      feature.setGeometryName('mygeom');
      feature.setGeometry(new Point([5, 10]));
      const geojson = format.writeFeaturesObject([feature]);
      expect(geojson.features[0].properties.mygeom).to.eql(undefined);
    });

    it('writes out a feature without properties correctly', function () {
      const feature = new Feature(new Point([5, 10]));
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.properties).to.eql(null);
      expect(geojson.geometry).to.eql({type: 'Point', coordinates: [5, 10]});
    });

    it('writes out a feature with only non-geometry properties correctly', function () {
      const feature = new Feature({foo: 'bar'});
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.geometry).to.eql(null);
      expect(geojson.properties).to.eql({foo: 'bar'});
    });

    it('writes out a feature with deleted properties correctly', function () {
      const feature = new Feature({foo: 'bar'});
      feature.unset('foo');
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.geometry).to.eql(null);
      expect(geojson.properties).to.eql(null);
    });

    it('writes out a feature without geometry correctly', function () {
      const feature = new Feature();
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.geometry).to.eql(null);
    });

    it('writes out a feature with id equal to 0 correctly', function () {
      const feature = new Feature();
      feature.setId(0);
      const geojson = format.writeFeatureObject(feature);
      expect(geojson.id).to.eql(0);
    });
  });

  describe('#writeGeometry', function () {
    it('encodes point', function () {
      const point = new Point([10, 20]);
      const geojson = format.writeGeometry(point);
      expect(point.getCoordinates()).to.eql(
        format.readGeometry(geojson).getCoordinates()
      );
    });

    it('accepts featureProjection', function () {
      const point = new Point(fromLonLat([10, 20]));
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
      });
      const obj = JSON.parse(geojson);
      expect(obj.coordinates).to.eql(toLonLat(point.getCoordinates()));
    });

    it('respects featureProjection passed to constructor', function () {
      const format = new GeoJSON({featureProjection: 'EPSG:3857'});
      const point = new Point(fromLonLat([10, 20]));
      const geojson = format.writeGeometry(point);
      const obj = JSON.parse(geojson);
      expect(obj.coordinates).to.eql(toLonLat(point.getCoordinates()));
    });

    it('encodes linestring', function () {
      const linestring = new LineString([
        [10, 20],
        [30, 40],
      ]);
      const geojson = format.writeGeometry(linestring);
      expect(linestring.getCoordinates()).to.eql(
        format.readGeometry(geojson).getCoordinates()
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
      expect(polygon.getCoordinates()).to.eql(
        format.readGeometry(geojson).getCoordinates()
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

      expect(JSON.parse(format.writeGeometry(right))).to.eql(rightObj);
      expect(JSON.parse(format.writeGeometry(rightMulti))).to.eql(
        rightMultiObj
      );
      expect(JSON.parse(format.writeGeometry(left))).to.eql(leftObj);
      expect(JSON.parse(format.writeGeometry(leftMulti))).to.eql(leftMultiObj);
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
      expect(JSON.parse(json)).to.eql(rightObj);
      json = format.writeGeometry(rightMulti, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightMultiObj);

      json = format.writeGeometry(left, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightObj);
      json = format.writeGeometry(leftMulti, {rightHanded: true});
      expect(JSON.parse(json)).to.eql(rightMultiObj);
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
      expect(JSON.parse(json)).to.eql(leftObj);
      json = format.writeGeometry(rightMulti, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftMultiObj);

      json = format.writeGeometry(left, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftObj);
      json = format.writeGeometry(leftMulti, {rightHanded: false});
      expect(JSON.parse(json)).to.eql(leftMultiObj);
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
      expect(got).to.be.an(GeometryCollection);
      const gotGeometries = got.getGeometries();
      const geometries = collection.getGeometries();
      expect(geometries.length).to.equal(gotGeometries.length);
      for (let i = 0, ii = geometries.length; i < ii; ++i) {
        expect(geometries[i].getCoordinates()).to.eql(
          gotGeometries[i].getCoordinates()
        );
      }
    });

    it('encodes a circle as an empty geometry collection', function () {
      const circle = new Circle([0, 0], 1);
      const geojson = format.writeGeometryObject(circle);
      expect(geojson).to.eql({
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
      expect(point.getCoordinates()[0]).to.roughlyEqual(
        newPoint.getCoordinates()[0],
        1e-8
      );
      expect(point.getCoordinates()[1]).to.roughlyEqual(
        newPoint.getCoordinates()[1],
        1e-8
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
      expect(geometries[0].getCoordinates()[0]).to.roughlyEqual(
        gotGeometries[0].getCoordinates()[0],
        1e-8
      );
      expect(geometries[0].getCoordinates()[1]).to.roughlyEqual(
        gotGeometries[0].getCoordinates()[1],
        1e-8
      );
      expect(geometries[1].getCoordinates()[0][0]).to.roughlyEqual(
        gotGeometries[1].getCoordinates()[0][0],
        1e-8
      );
      expect(geometries[1].getCoordinates()[0][1]).to.roughlyEqual(
        gotGeometries[1].getCoordinates()[0][1],
        1e-8
      );
    });

    it('truncates transformed point with decimals option', function () {
      const point = new Point([2, 3]).transform('EPSG:4326', 'EPSG:3857');
      const geojson = format.writeGeometry(point, {
        featureProjection: 'EPSG:3857',
        decimals: 2,
      });
      expect(format.readGeometry(geojson).getCoordinates()).to.eql([2, 3]);
    });

    it('truncates a linestring with decimals option', function () {
      const linestring = new LineString([
        [42.123456789, 38.987654321],
        [43, 39],
      ]);
      const geojson = format.writeGeometry(linestring, {
        decimals: 6,
      });
      expect(format.readGeometry(geojson).getCoordinates()).to.eql([
        [42.123457, 38.987654],
        [43, 39],
      ]);
      expect(linestring.getCoordinates()).to.eql([
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
      expect(format.readGeometry(geojson).getCoordinates()).to.eql([
        [42, 39],
        [43, 39],
      ]);
      expect(linestring.getCoordinates()).to.eql([
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
      expect(geojson).to.eql({
        type: 'MultiPolygon',
        coordinates: coordinates,
      });
    });
  });
});
