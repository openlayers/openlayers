import {assert} from 'chai';
import fse from 'fs-extra';
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

describe('ol/format/EsriJSON.js', function () {
  let format;
  beforeEach(function () {
    format = new EsriJSON();
  });

  const pointEsriJSON = {
    geometry: {
      x: 102.0,
      y: 0.5,
    },
    attributes: {
      'prop0': 'value0',
    },
  };

  const multiPointEsriJSON = {
    geometry: {
      'points': [
        [102.0, 0.0],
        [103.0, 1.0],
      ],
    },
    attributes: {
      'prop0': 'value0',
    },
  };

  const lineStringEsriJSON = {
    geometry: {
      paths: [
        [
          [102.0, 0.0],
          [103.0, 1.0],
          [104.0, 0.0],
          [105.0, 1.0],
        ],
      ],
    },
    attributes: {
      'prop0': 'value0',
      'prop1': 0.0,
    },
  };

  const multiLineStringEsriJSON = {
    geometry: {
      paths: [
        [
          [102.0, 0.0],
          [103.0, 1.0],
          [104.0, 0.0],
          [105.0, 1.0],
        ],
        [
          [105.0, 3.0],
          [106.0, 4.0],
          [107.0, 3.0],
          [108.0, 4.0],
        ],
      ],
    },
    attributes: {
      'prop0': 'value0',
      'prop1': 0.0,
    },
  };

  const polygonEsriJSON = {
    geometry: {
      rings: [
        [
          [100.0, 0.0],
          [100.0, 1.0],
          [101.0, 1.0],
          [101.0, 0.0],
        ],
      ],
    },
    attributes: {
      'prop0': 'value0',
      'prop1': {'this': 'that'},
    },
  };

  const multiPolygonEsriJSON = {
    geometry: {
      rings: [
        [
          [0, 1],
          [1, 4],
          [4, 3],
          [3, 0],
        ],
        [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 3],
        ],
        [
          [10, 1],
          [11, 5],
          [14, 3],
          [13, 0],
        ],
      ],
    },
  };

  const featureCollectionEsriJSON = {
    objectIdFieldName: 'prop0',
    features: [pointEsriJSON, lineStringEsriJSON, polygonEsriJSON],
  };

  const data = {
    features: [
      {
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
          'SHAPE_LEN': 46.3826,
        },
        geometry: {
          paths: [
            [
              [1549497.66985, 6403707.96],
              [1549491.1, 6403710.1],
              [1549488.03995, 6403716.7504],
              [1549488.5401, 6403724.5504],
              [1549494.37985, 6403733.54],
              [1549499.6799, 6403738.0504],
              [1549506.22, 6403739.2504],
            ],
          ],
        },
      },
      {
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
          'SHAPE_LEN': 70.3106,
        },
        geometry: {
          paths: [
            [
              [1549754.2769, 6403854.8024],
              [1549728.45985, 6403920.2],
            ],
          ],
        },
      },
    ],
  };

  describe('#readFeature', function () {
    it('can read a single point feature', function () {
      const feature = format.readFeature(pointEsriJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Point);
      assert.deepEqual(geometry.getCoordinates(), [102.0, 0.5]);
      assert.strictEqual(feature.get('prop0'), 'value0');
    });

    it('can read a single multipoint feature', function () {
      const feature = format.readFeature(multiPointEsriJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, MultiPoint);
      assert.deepEqual(geometry.getCoordinates(), [
        [102.0, 0.0],
        [103.0, 1.0],
      ]);
      assert.strictEqual(feature.get('prop0'), 'value0');
    });

    it('can read a single line string feature', function () {
      const feature = format.readFeature(lineStringEsriJSON);
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

    it('can read a multi line string feature', function () {
      const feature = format.readFeature(multiLineStringEsriJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, MultiLineString);
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [102.0, 0.0],
          [103.0, 1.0],
          [104.0, 0.0],
          [105.0, 1.0],
        ],
        [
          [105.0, 3.0],
          [106.0, 4.0],
          [107.0, 3.0],
          [108.0, 4.0],
        ],
      ]);
      assert.strictEqual(feature.get('prop0'), 'value0');
      assert.strictEqual(feature.get('prop1'), 0.0);
    });

    it('can read a single polygon feature', function () {
      const feature = format.readFeature(polygonEsriJSON);
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

    it('can read a multi polygon feature', function () {
      const feature = format.readFeature(multiPolygonEsriJSON);
      assert.instanceOf(feature, Feature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, MultiPolygon);
      assert.deepEqual(geometry.getCoordinates(), [
        [
          [
            [0, 1],
            [1, 4],
            [4, 3],
            [3, 0],
          ],
          [
            [2, 2],
            [3, 2],
            [3, 3],
            [2, 3],
          ],
        ],
        [
          [
            [10, 1],
            [11, 5],
            [14, 3],
            [13, 0],
          ],
        ],
      ]);
    });

    it('can read a feature collection', function () {
      const features = format.readFeatures(featureCollectionEsriJSON);
      assert.lengthOf(features, 3);
      assert.instanceOf(features[0].getGeometry(), Point);
      assert.instanceOf(features[1].getGeometry(), LineString);
      assert.instanceOf(features[2].getGeometry(), Polygon);

      assert.deepEqual(features[0].getId(), 'value0');
      assert.deepEqual(features[1].getId(), 'value0');
      assert.deepEqual(features[2].getId(), 'value0');
    });

    it('can read and transform a point', function () {
      const feature = format.readFeatures(pointEsriJSON, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });
      assert.instanceOf(feature[0].getGeometry(), Point);
      assert.deepEqual(
        feature[0].getGeometry().getCoordinates(),
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
      );
    });

    it('can read and transform a feature collection', function () {
      const features = format.readFeatures(featureCollectionEsriJSON, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
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
      const feature = new EsriJSON({geometryName: 'the_geom'}).readFeature(
        pointEsriJSON,
      );
      assert.strictEqual(feature.getGeometryName(), 'the_geom');
      assert.instanceOf(feature.getGeometry(), Point);
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

    it('parses ksfields.geojson', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/EsriJSON/ksfields.json',
        {encoding: 'utf8'},
      );
      const result = format.readFeatures(text);
      assert.strictEqual(result.length, 9);

      const first = result[0];
      assert.instanceOf(first, Feature);
      assert.strictEqual(first.get('field_name'), 'EUDORA');
      assert.strictEqual(first.getId(), 6406);
      const firstGeom = first.getGeometry();
      assert.instanceOf(firstGeom, Polygon);
      assert.strictEqual(
        equals(
          firstGeom.getExtent(),
          [
            -10585772.743554419, 4712365.161160459, -10579560.16462974,
            4716567.373073828,
          ],
        ),
        true,
      );

      const last = result[8];
      assert.instanceOf(last, Feature);
      assert.strictEqual(last.get('field_name'), 'FEAGINS');
      assert.strictEqual(last.getId(), 6030);
      const lastGeom = last.getGeometry();
      assert.instanceOf(lastGeom, Polygon);
      assert.strictEqual(
        equals(
          lastGeom.getExtent(),
          [
            -10555714.026858449, 4576511.565880965, -10553671.199322715,
            4578554.9934867555,
          ],
        ),
        true,
      );
    });
  });

  describe('#readGeometry', function () {
    it('parses point', function () {
      const str = JSON.stringify({
        x: 10,
        y: 20,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Point);
      assert.deepEqual(obj.getCoordinates(), [10, 20]);
      assert.deepEqual(obj.getLayout(), 'XY');
    });

    it('parses XYZ point', function () {
      const str = JSON.stringify({
        x: 10,
        y: 20,
        z: 10,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Point);
      assert.deepEqual(obj.getCoordinates(), [10, 20, 10]);
      assert.deepEqual(obj.getLayout(), 'XYZ');
    });

    it('parses XYM point', function () {
      const str = JSON.stringify({
        x: 10,
        y: 20,
        m: 10,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Point);
      assert.deepEqual(obj.getCoordinates(), [10, 20, 10]);
      assert.deepEqual(obj.getLayout(), 'XYM');
    });

    it('parses XYZM point', function () {
      const str = JSON.stringify({
        x: 10,
        y: 20,
        z: 0,
        m: 10,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Point);
      assert.deepEqual(obj.getCoordinates(), [10, 20, 0, 10]);
      assert.deepEqual(obj.getLayout(), 'XYZM');
    });

    it('parses multipoint', function () {
      const str = JSON.stringify({
        points: [
          [10, 20],
          [20, 30],
        ],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPoint);
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20],
        [20, 30],
      ]);
      assert.deepEqual(obj.getLayout(), 'XY');
    });

    it('parses XYZ multipoint', function () {
      const str = JSON.stringify({
        points: [
          [10, 20, 0],
          [20, 30, 0],
        ],
        hasZ: true,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPoint);
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20, 0],
        [20, 30, 0],
      ]);
      assert.deepEqual(obj.getLayout(), 'XYZ');
    });

    it('parses XYM multipoint', function () {
      const str = JSON.stringify({
        points: [
          [10, 20, 0],
          [20, 30, 0],
        ],
        hasM: true,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPoint);
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20, 0],
        [20, 30, 0],
      ]);
      assert.deepEqual(obj.getLayout(), 'XYM');
    });

    it('parses XYZM multipoint', function () {
      const str = JSON.stringify({
        points: [
          [10, 20, 0, 1],
          [20, 30, 0, 1],
        ],
        hasZ: true,
        hasM: true,
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPoint);
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20, 0, 1],
        [20, 30, 0, 1],
      ]);
      assert.deepEqual(obj.getLayout(), 'XYZM');
    });

    it('parses linestring', function () {
      const str = JSON.stringify({
        paths: [
          [
            [10, 20],
            [30, 40],
          ],
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
        hasZ: true,
        paths: [
          [
            [10, 20, 1534],
            [30, 40, 1420],
          ],
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

    it('parses XYM linestring', function () {
      const str = JSON.stringify({
        hasM: true,
        paths: [
          [
            [10, 20, 1534],
            [30, 40, 1420],
          ],
        ],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, LineString);
      assert.deepEqual(obj.getLayout(), 'XYM');
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20, 1534],
        [30, 40, 1420],
      ]);
    });

    it('parses XYZM linestring', function () {
      const str = JSON.stringify({
        hasZ: true,
        hasM: true,
        paths: [
          [
            [10, 20, 1534, 1],
            [30, 40, 1420, 2],
          ],
        ],
      });

      const obj = format.readGeometry(str);
      assert.instanceOf(obj, LineString);
      assert.deepEqual(obj.getLayout(), 'XYZM');
      assert.deepEqual(obj.getCoordinates(), [
        [10, 20, 1534, 1],
        [30, 40, 1420, 2],
      ]);
    });

    it('parses multilinestring', function () {
      const str = JSON.stringify({
        paths: [
          [
            [102.0, 0.0],
            [103.0, 1.0],
            [104.0, 0.0],
            [105.0, 1.0],
          ],
          [
            [105.0, 3.0],
            [106.0, 4.0],
            [107.0, 3.0],
            [108.0, 4.0],
          ],
        ],
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiLineString);
      assert.deepEqual(obj.getCoordinates(), [
        [
          [102.0, 0.0],
          [103.0, 1.0],
          [104.0, 0.0],
          [105.0, 1.0],
        ],
        [
          [105.0, 3.0],
          [106.0, 4.0],
          [107.0, 3.0],
          [108.0, 4.0],
        ],
      ]);
      assert.deepEqual(obj.getLayout(), 'XY');
    });

    it('parses XYZ multilinestring', function () {
      const str = JSON.stringify({
        hasZ: true,
        paths: [
          [
            [102.0, 0.0, 1],
            [103.0, 1.0, 1],
            [104.0, 0.0, 1],
            [105.0, 1.0, 1],
          ],
          [
            [105.0, 3.0, 1],
            [106.0, 4.0, 1],
            [107.0, 3.0, 1],
            [108.0, 4.0, 1],
          ],
        ],
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiLineString);
      assert.deepEqual(obj.getCoordinates(), [
        [
          [102.0, 0.0, 1],
          [103.0, 1.0, 1],
          [104.0, 0.0, 1],
          [105.0, 1.0, 1],
        ],
        [
          [105.0, 3.0, 1],
          [106.0, 4.0, 1],
          [107.0, 3.0, 1],
          [108.0, 4.0, 1],
        ],
      ]);
      assert.deepEqual(obj.getLayout(), 'XYZ');
    });

    it('parses XYM multilinestring', function () {
      const str = JSON.stringify({
        hasM: true,
        paths: [
          [
            [102.0, 0.0, 1],
            [103.0, 1.0, 1],
            [104.0, 0.0, 1],
            [105.0, 1.0, 1],
          ],
          [
            [105.0, 3.0, 1],
            [106.0, 4.0, 1],
            [107.0, 3.0, 1],
            [108.0, 4.0, 1],
          ],
        ],
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiLineString);
      assert.deepEqual(obj.getCoordinates(), [
        [
          [102.0, 0.0, 1],
          [103.0, 1.0, 1],
          [104.0, 0.0, 1],
          [105.0, 1.0, 1],
        ],
        [
          [105.0, 3.0, 1],
          [106.0, 4.0, 1],
          [107.0, 3.0, 1],
          [108.0, 4.0, 1],
        ],
      ]);
      assert.deepEqual(obj.getLayout(), 'XYM');
    });

    it('parses XYZM multilinestring', function () {
      const str = JSON.stringify({
        hasM: true,
        hasZ: true,
        paths: [
          [
            [102, 0, 1, 2],
            [103, 1, 1, 2],
            [104, 0, 1, 2],
            [105, 1, 1, 2],
          ],
          [
            [105, 3, 1, 2],
            [106, 4, 1, 2],
            [107, 3, 1, 2],
            [108, 4, 1, 2],
          ],
        ],
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiLineString);
      assert.deepEqual(obj.getCoordinates(), [
        [
          [102, 0, 1, 2],
          [103, 1, 1, 2],
          [104, 0, 1, 2],
          [105, 1, 1, 2],
        ],
        [
          [105, 3, 1, 2],
          [106, 4, 1, 2],
          [107, 3, 1, 2],
          [108, 4, 1, 2],
        ],
      ]);
      assert.deepEqual(obj.getLayout(), 'XYZM');
    });

    it('parses polygon', function () {
      const outer = [
        [0, 0],
        [0, 10],
        [10, 10],
        [10, 0],
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
        rings: [outer, inner1, inner2],
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Polygon);
      assert.deepEqual(obj.getLayout(), 'XY');
      const rings = obj.getLinearRings();
      assert.strictEqual(rings.length, 3);
      assert.equal(rings[0].getCoordinates()[0].length, 2);
      assert.instanceOf(rings[0], LinearRing);
      assert.instanceOf(rings[1], LinearRing);
      assert.instanceOf(rings[2], LinearRing);
    });

    it('parses XYZ polygon', function () {
      const outer = [
        [0, 0, 5],
        [0, 10, 5],
        [10, 10, 5],
        [10, 0, 5],
        [0, 0, 5],
      ];
      const inner1 = [
        [1, 1, 3],
        [2, 1, 3],
        [2, 2, 3],
        [1, 2, 3],
        [1, 1, 3],
      ];
      const inner2 = [
        [8, 8, 2],
        [9, 8, 2],
        [9, 9, 2],
        [8, 9, 2],
        [8, 8, 2],
      ];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasZ: true,
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Polygon);
      assert.deepEqual(obj.getLayout(), 'XYZ');
      const rings = obj.getLinearRings();
      assert.strictEqual(rings.length, 3);
      assert.equal(rings[0].getCoordinates()[0].length, 3);
      assert.instanceOf(rings[0], LinearRing);
      assert.instanceOf(rings[1], LinearRing);
      assert.instanceOf(rings[2], LinearRing);
    });

    it('parses XYM polygon', function () {
      const outer = [
        [0, 0, 5],
        [0, 10, 5],
        [10, 10, 5],
        [10, 0, 5],
        [0, 0, 5],
      ];
      const inner1 = [
        [1, 1, 3],
        [2, 1, 3],
        [2, 2, 3],
        [1, 2, 3],
        [1, 1, 3],
      ];
      const inner2 = [
        [8, 8, 2],
        [9, 8, 2],
        [9, 9, 2],
        [8, 9, 2],
        [8, 8, 2],
      ];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasM: true,
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Polygon);
      assert.deepEqual(obj.getLayout(), 'XYM');
      const rings = obj.getLinearRings();
      assert.strictEqual(rings.length, 3);
      assert.equal(rings[0].getCoordinates()[0].length, 3);
      assert.instanceOf(rings[0], LinearRing);
      assert.instanceOf(rings[1], LinearRing);
      assert.instanceOf(rings[2], LinearRing);
    });

    it('parses XYZM polygon', function () {
      const outer = [
        [0, 0, 5, 1],
        [0, 10, 5, 1],
        [10, 10, 5, 1],
        [10, 0, 5, 1],
        [0, 0, 5, 1],
      ];
      const inner1 = [
        [1, 1, 3, 2],
        [2, 1, 3, 2],
        [2, 2, 3, 2],
        [1, 2, 3, 2],
        [1, 1, 3, 2],
      ];
      const inner2 = [
        [8, 8, 2, 1],
        [9, 8, 2, 1],
        [9, 9, 2, 1],
        [8, 9, 2, 1],
        [8, 8, 2, 1],
      ];
      const str = JSON.stringify({
        rings: [outer, inner1, inner2],
        hasZ: true,
        hasM: true,
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, Polygon);
      assert.deepEqual(obj.getLayout(), 'XYZM');
      const rings = obj.getLinearRings();
      assert.strictEqual(rings.length, 3);
      assert.equal(rings[0].getCoordinates()[0].length, 4);
      assert.instanceOf(rings[0], LinearRing);
      assert.instanceOf(rings[1], LinearRing);
      assert.instanceOf(rings[2], LinearRing);
    });

    it('parses XY multipolygon', function () {
      const str = JSON.stringify({
        rings: [
          [
            [0, 1],
            [1, 4],
            [4, 3],
            [3, 0],
          ],
          [
            [2, 2],
            [3, 2],
            [3, 3],
            [2, 3],
          ],
          [
            [10, 1],
            [11, 5],
            [14, 3],
            [13, 0],
          ],
        ],
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPolygon);
      assert.deepEqual(obj.getLayout(), 'XY');
      assert.deepEqual(obj.getCoordinates(), [
        [
          [
            [0, 1],
            [1, 4],
            [4, 3],
            [3, 0],
          ],
          [
            [2, 2],
            [3, 2],
            [3, 3],
            [2, 3],
          ],
        ],
        [
          [
            [10, 1],
            [11, 5],
            [14, 3],
            [13, 0],
          ],
        ],
      ]);
    });

    it('parses XYZ multipolygon', function () {
      const str = JSON.stringify({
        rings: [
          [
            [0, 1, 0],
            [1, 4, 0],
            [4, 3, 0],
            [3, 0, 0],
          ],
          [
            [2, 2, 0],
            [3, 2, 0],
            [3, 3, 0],
            [2, 3, 0],
          ],
          [
            [10, 1, 0],
            [11, 5, 0],
            [14, 3, 0],
            [13, 0, 0],
          ],
        ],
        hasZ: true,
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPolygon);
      assert.deepEqual(obj.getLayout(), 'XYZ');
      assert.deepEqual(obj.getCoordinates(), [
        [
          [
            [0, 1, 0],
            [1, 4, 0],
            [4, 3, 0],
            [3, 0, 0],
          ],
          [
            [2, 2, 0],
            [3, 2, 0],
            [3, 3, 0],
            [2, 3, 0],
          ],
        ],
        [
          [
            [10, 1, 0],
            [11, 5, 0],
            [14, 3, 0],
            [13, 0, 0],
          ],
        ],
      ]);
    });

    it('parses XYM multipolygon', function () {
      const str = JSON.stringify({
        rings: [
          [
            [0, 1, 0],
            [1, 4, 0],
            [4, 3, 0],
            [3, 0, 0],
          ],
          [
            [2, 2, 0],
            [3, 2, 0],
            [3, 3, 0],
            [2, 3, 0],
          ],
          [
            [10, 1, 0],
            [11, 5, 0],
            [14, 3, 0],
            [13, 0, 0],
          ],
        ],
        hasM: true,
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPolygon);
      assert.deepEqual(obj.getLayout(), 'XYM');
      assert.deepEqual(obj.getCoordinates(), [
        [
          [
            [0, 1, 0],
            [1, 4, 0],
            [4, 3, 0],
            [3, 0, 0],
          ],
          [
            [2, 2, 0],
            [3, 2, 0],
            [3, 3, 0],
            [2, 3, 0],
          ],
        ],
        [
          [
            [10, 1, 0],
            [11, 5, 0],
            [14, 3, 0],
            [13, 0, 0],
          ],
        ],
      ]);
    });

    it('parses XYZM multipolygon', function () {
      const str = JSON.stringify({
        rings: [
          [
            [0, 1, 0, 1],
            [1, 4, 0, 1],
            [4, 3, 0, 1],
            [3, 0, 0, 1],
          ],
          [
            [2, 2, 0, 1],
            [3, 2, 0, 1],
            [3, 3, 0, 1],
            [2, 3, 0, 1],
          ],
          [
            [10, 1, 0, 1],
            [11, 5, 0, 1],
            [14, 3, 0, 1],
            [13, 0, 0, 1],
          ],
        ],
        hasZ: true,
        hasM: true,
      });
      const obj = format.readGeometry(str);
      assert.instanceOf(obj, MultiPolygon);
      assert.deepEqual(obj.getLayout(), 'XYZM');
      assert.deepEqual(obj.getCoordinates(), [
        [
          [
            [0, 1, 0, 1],
            [1, 4, 0, 1],
            [4, 3, 0, 1],
            [3, 0, 0, 1],
          ],
          [
            [2, 2, 0, 1],
            [3, 2, 0, 1],
            [3, 3, 0, 1],
            [2, 3, 0, 1],
          ],
        ],
        [
          [
            [10, 1, 0, 1],
            [11, 5, 0, 1],
            [14, 3, 0, 1],
            [13, 0, 0, 1],
          ],
        ],
      ]);
    });

    it('should not mutate input', function () {
      const input = {
        rings: [
          [
            [0, 1, 0, 1],
            [1, 4, 0, 1],
            [4, 3, 0, 1],
            [3, 0, 0, 1],
          ],
          [
            [2, 2, 0, 1],
            [3, 2, 0, 1],
            [3, 3, 0, 1],
            [2, 3, 0, 1],
          ],
          [
            [10, 1, 0, 1],
            [11, 5, 0, 1],
            [14, 3, 0, 1],
            [13, 0, 0, 1],
          ],
        ],
        hasZ: true,
        hasM: true,
      };
      const str = JSON.stringify(input);
      const obj = format.readGeometry(input);

      assert.instanceOf(obj, MultiPolygon);
      assert.deepEqual(str, JSON.stringify(input));
    });
  });

  describe('#readProjection', function () {
    it('reads named crs from top-level object', function () {
      const json = {
        spatialReference: {
          wkid: 3857,
        },
        features: [
          {
            attributes: {
              foo: 'bar',
            },
            geometry: {
              x: 1,
              y: 2,
            },
          },
          {
            attributes: {
              bam: 'baz',
            },
            geometry: {
              paths: [
                [
                  [1, 2],
                  [3, 4],
                ],
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
  });

  describe('#writeGeometry', function () {
    it('encodes point', function () {
      const point = new Point([10, 20]);
      const esrijson = format.writeGeometry(point);
      assert.deepEqual(
        point.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZ point', function () {
      const point = new Point([10, 20, 0], 'XYZ');
      const esrijson = format.writeGeometry(point);
      assert.deepEqual(
        point.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYM point', function () {
      const point = new Point([10, 20, 0], 'XYM');
      const esrijson = format.writeGeometry(point);
      assert.deepEqual(
        point.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZM point', function () {
      const point = new Point([10, 20, 5, 0], 'XYZM');
      const esrijson = format.writeGeometry(point);
      assert.deepEqual(
        point.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes linestring', function () {
      const linestring = new LineString([
        [10, 20],
        [30, 40],
      ]);
      const esrijson = format.writeGeometry(linestring);
      assert.deepEqual(
        linestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZ linestring', function () {
      const linestring = new LineString(
        [
          [10, 20, 1534],
          [30, 40, 1420],
        ],
        'XYZ',
      );
      const esrijson = format.writeGeometry(linestring);
      assert.deepEqual(
        linestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYM linestring', function () {
      const linestring = new LineString(
        [
          [10, 20, 1534],
          [30, 40, 1420],
        ],
        'XYM',
      );
      const esrijson = format.writeGeometry(linestring);
      assert.deepEqual(
        linestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZM linestring', function () {
      const linestring = new LineString(
        [
          [10, 20, 1534, 1],
          [30, 40, 1420, 1],
        ],
        'XYZM',
      );
      const esrijson = format.writeGeometry(linestring);
      assert.deepEqual(
        linestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
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
      const esrijson = format.writeGeometry(polygon);
      assert.deepEqual(
        polygon.getCoordinates(false),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZ polygon', function () {
      const outer = [
        [0, 0, 5],
        [0, 10, 5],
        [10, 10, 5],
        [10, 0, 5],
        [0, 0, 5],
      ];
      const inner1 = [
        [1, 1, 3],
        [2, 1, 3],
        [2, 2, 3],
        [1, 2, 3],
        [1, 1, 3],
      ];
      const inner2 = [
        [8, 8, 2],
        [9, 8, 2],
        [9, 9, 2],
        [8, 9, 2],
        [8, 8, 2],
      ];
      const polygon = new Polygon([outer, inner1, inner2], 'XYZ');
      const esrijson = format.writeGeometry(polygon);
      assert.deepEqual(
        polygon.getCoordinates(false),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYM polygon', function () {
      const outer = [
        [0, 0, 5],
        [0, 10, 5],
        [10, 10, 5],
        [10, 0, 5],
        [0, 0, 5],
      ];
      const inner1 = [
        [1, 1, 3],
        [2, 1, 3],
        [2, 2, 3],
        [1, 2, 3],
        [1, 1, 3],
      ];
      const inner2 = [
        [8, 8, 2],
        [9, 8, 2],
        [9, 9, 2],
        [8, 9, 2],
        [8, 8, 2],
      ];
      const polygon = new Polygon([outer, inner1, inner2], 'XYM');
      const esrijson = format.writeGeometry(polygon);
      assert.deepEqual(
        polygon.getCoordinates(false),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZM polygon', function () {
      const outer = [
        [0, 0, 5, 1],
        [0, 10, 5, 2],
        [10, 10, 5, 1],
        [10, 0, 5, 1],
        [0, 0, 5, 1],
      ];
      const inner1 = [
        [1, 1, 3, 1],
        [2, 1, 3, 2],
        [2, 2, 3, 1],
        [1, 2, 3, 1],
        [1, 1, 3, 1],
      ];
      const inner2 = [
        [8, 8, 2, 1],
        [9, 8, 2, 2],
        [9, 9, 2, 1],
        [8, 9, 2, 1],
        [8, 8, 2, 1],
      ];
      const polygon = new Polygon([outer, inner1, inner2], 'XYZM');
      const esrijson = format.writeGeometry(polygon);
      assert.deepEqual(
        polygon.getCoordinates(false),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes multipoint', function () {
      const multipoint = new MultiPoint([
        [102.0, 0.0],
        [103.0, 1.0],
      ]);
      const esrijson = format.writeGeometry(multipoint);
      assert.deepEqual(
        multipoint.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZ multipoint', function () {
      const multipoint = new MultiPoint(
        [
          [102.0, 0.0, 3],
          [103.0, 1.0, 4],
        ],
        'XYZ',
      );
      const esrijson = format.writeGeometry(multipoint);
      assert.deepEqual(
        multipoint.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYM multipoint', function () {
      const multipoint = new MultiPoint(
        [
          [102.0, 0.0, 3],
          [103.0, 1.0, 4],
        ],
        'XYM',
      );
      const esrijson = format.writeGeometry(multipoint);
      assert.deepEqual(
        multipoint.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZM multipoint', function () {
      const multipoint = new MultiPoint(
        [
          [102.0, 0.0, 3, 1],
          [103.0, 1.0, 4, 1],
        ],
        'XYZM',
      );
      const esrijson = format.writeGeometry(multipoint);
      assert.deepEqual(
        multipoint.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes multilinestring', function () {
      const multilinestring = new MultiLineString([
        [
          [102.0, 0.0],
          [103.0, 1.0],
          [104.0, 0.0],
          [105.0, 1.0],
        ],
        [
          [105.0, 3.0],
          [106.0, 4.0],
          [107.0, 3.0],
          [108.0, 4.0],
        ],
      ]);
      const esrijson = format.writeGeometry(multilinestring);
      assert.deepEqual(
        multilinestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZ multilinestring', function () {
      const multilinestring = new MultiLineString(
        [
          [
            [102.0, 0.0, 1],
            [103.0, 1.0, 2],
            [104.0, 0.0, 3],
            [105.0, 1.0, 4],
          ],
          [
            [105.0, 3.0, 1],
            [106.0, 4.0, 2],
            [107.0, 3.0, 3],
            [108.0, 4.0, 4],
          ],
        ],
        'XYZ',
      );
      const esrijson = format.writeGeometry(multilinestring);
      assert.deepEqual(
        multilinestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYM multilinestring', function () {
      const multilinestring = new MultiLineString(
        [
          [
            [102.0, 0.0, 1],
            [103.0, 1.0, 2],
            [104.0, 0.0, 3],
            [105.0, 1.0, 4],
          ],
          [
            [105.0, 3.0, 1],
            [106.0, 4.0, 2],
            [107.0, 3.0, 3],
            [108.0, 4.0, 4],
          ],
        ],
        'XYM',
      );
      const esrijson = format.writeGeometry(multilinestring);
      assert.deepEqual(
        multilinestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZM multilinestring', function () {
      const multilinestring = new MultiLineString(
        [
          [
            [102.0, 0.0, 1, 0],
            [103.0, 1.0, 2, 2],
            [104.0, 0.0, 3, 1],
            [105.0, 1.0, 4, 2],
          ],
          [
            [105.0, 3.0, 1, 0],
            [106.0, 4.0, 2, 1],
            [107.0, 3.0, 3, 1],
            [108.0, 4.0, 4, 2],
          ],
        ],
        'XYZM',
      );
      const esrijson = format.writeGeometry(multilinestring);
      assert.deepEqual(
        multilinestring.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes multipolygon', function () {
      const multipolygon = new MultiPolygon([
        [
          [
            [0, 1],
            [1, 4],
            [4, 3],
            [3, 0],
          ],
          [
            [2, 2],
            [3, 2],
            [3, 3],
            [2, 3],
          ],
        ],
        [
          [
            [10, 1],
            [11, 5],
            [14, 3],
            [13, 0],
          ],
        ],
      ]);
      const esrijson = format.writeGeometry(multipolygon);
      assert.deepEqual(
        multipolygon.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZ multipolygon', function () {
      const multipolygon = new MultiPolygon(
        [
          [
            [
              [0, 1, 0],
              [1, 4, 0],
              [4, 3, 0],
              [3, 0, 0],
            ],
            [
              [2, 2, 0],
              [3, 2, 0],
              [3, 3, 0],
              [2, 3, 0],
            ],
          ],
          [
            [
              [10, 1, 0],
              [11, 5, 0],
              [14, 3, 0],
              [13, 0, 0],
            ],
          ],
        ],
        'XYZ',
      );
      const esrijson = format.writeGeometry(multipolygon);
      assert.deepEqual(
        multipolygon.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYM multipolygon', function () {
      const multipolygon = new MultiPolygon(
        [
          [
            [
              [0, 1, 0],
              [1, 4, 0],
              [4, 3, 0],
              [3, 0, 0],
            ],
            [
              [2, 2, 0],
              [3, 2, 0],
              [3, 3, 0],
              [2, 3, 0],
            ],
          ],
          [
            [
              [10, 1, 0],
              [11, 5, 0],
              [14, 3, 0],
              [13, 0, 0],
            ],
          ],
        ],
        'XYM',
      );
      const esrijson = format.writeGeometry(multipolygon);
      assert.deepEqual(
        multipolygon.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('encodes XYZM multipolygon', function () {
      const multipolygon = new MultiPolygon(
        [
          [
            [
              [0, 1, 0, 1],
              [1, 4, 0, 1],
              [4, 3, 0, 3],
              [3, 0, 0, 3],
            ],
            [
              [2, 2, 0, 3],
              [3, 2, 0, 4],
              [3, 3, 0, 1],
              [2, 3, 0, 1],
            ],
          ],
          [
            [
              [10, 1, 0, 1],
              [11, 5, 0, 2],
              [14, 3, 0, 3],
              [13, 0, 0, 3],
            ],
          ],
        ],
        'XYZM',
      );
      const esrijson = format.writeGeometry(multipolygon);
      assert.deepEqual(
        multipolygon.getCoordinates(),
        format.readGeometry(esrijson).getCoordinates(),
      );
    });

    it('transforms and encodes a point', function () {
      const point = new Point([2, 3]);
      const esrijson = format.writeGeometry(point, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const newPoint = format.readGeometry(esrijson, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      assert.approximately(
        point.getCoordinates()[0],
        newPoint.getCoordinates()[0],
        1e-8,
      );
      assert.isBelow(
        Math.abs(point.getCoordinates()[1] - newPoint.getCoordinates()[1]),
        0.0000001,
      );
    });
  });

  describe('#writeFeatures', function () {
    it('encodes feature collection', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const esrijson = format.writeFeaturesObject(array);
      const result = format.readFeatures(esrijson);
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
      const esrijson = format.writeFeatures(array, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });
      const result = format.readFeatures(esrijson);
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
      const esrijson = format.writeFeaturesObject([feature]);
      assert.deepEqual(esrijson.features[0].attributes.mygeom, undefined);
    });

    it('writes out a feature without properties correctly', function () {
      const feature = new Feature(new Point([5, 10]));
      const esrijson = format.writeFeatureObject(feature);
      assert.deepEqual(esrijson.attributes, {});
    });

    it('adds the projection inside the geometry correctly when featureProjection is set', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const esrijson = format.writeFeaturesObject(array, {
        featureProjection: 'EPSG:3857',
      });
      esrijson.features.forEach(function (feature, i) {
        const spatialReference = feature.geometry.spatialReference;
        assert.equal(Number(spatialReference.wkid), 3857);
        assert.deepEqual(
          feature.geometry.paths[0],
          array[i].getGeometry().getCoordinates(),
        );
      });
    });

    it('adds the projection inside the geometry correctly when dataProjection is set', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const esrijson = format.writeFeaturesObject(array, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      esrijson.features.forEach(function (feature, i) {
        const spatialReference = feature.geometry.spatialReference;
        assert.equal(Number(spatialReference.wkid), 4326);
        assert.deepEqual(
          feature.geometry.paths[0],
          array[i]
            .getGeometry()
            .clone()
            .transform('EPSG:3857', 'EPSG:4326')
            .getCoordinates(),
        );
      });
    });

    it('does not add the projection inside the geometry when neither featurProjection nor dataProjection are set', function () {
      const str = JSON.stringify(data);
      const array = format.readFeatures(str);
      const esrijson = format.writeFeaturesObject(array);
      esrijson.features.forEach(function (feature, i) {
        assert.strictEqual(feature.geometry.spatialReference, undefined);
        assert.deepEqual(
          feature.geometry.paths[0],
          array[i].getGeometry().getCoordinates(),
        );
      });
    });
  });
});
