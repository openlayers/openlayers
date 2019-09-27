import {assert} from 'chai';
import fse from 'fs-extra';
import Feature from '../../../../src/ol/Feature.js';
import FeatureFormat from '../../../../src/ol/format/Feature.js';
import TopoJSON from '../../../../src/ol/format/TopoJSON.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {transform} from '../../../../src/ol/proj.js';

const aruba = {
  type: 'Topology',
  transform: {
    scale: [0.036003600360036005, 0.017361589674592462],
    translate: [-180, -89.99892578124998],
  },
  objects: {
    aruba: {
      type: 'Polygon',
      properties: {
        prop0: 'value0',
      },
      arcs: [[0]],
      id: 533,
    },
  },
  arcs: [
    [
      [3058, 5901],
      [0, -2],
      [-2, 1],
      [-1, 3],
      [-2, 3],
      [0, 3],
      [1, 1],
      [1, -3],
      [2, -5],
      [1, -1],
    ],
  ],
};

const zeroId = {
  type: 'Topology',
  objects: {
    foobar: {
      type: 'Point',
      id: 0,
      coordinates: [0, 42],
    },
  },
};

const nullGeometry = {
  type: 'Topology',
  objects: {
    foobar: {
      type: null,
      properties: {
        prop0: 'value0',
      },
      id: 533,
    },
  },
};

describe('ol/format/TopoJSON.js', function () {
  let format;
  before(function () {
    format = new TopoJSON();
  });

  describe('constructor', function () {
    it('creates a new format', function () {
      assert.instanceOf(format, FeatureFormat);
      assert.instanceOf(format, TopoJSON);
    });
  });

  describe('#readFeaturesFromTopology_()', function () {
    it('creates an array of features from a topology', function () {
      const features = format.readFeaturesFromObject(aruba);
      assert.lengthOf(features, 1);

      const feature = features[0];
      assert.instanceOf(feature, Feature);

      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Polygon);

      assert.strictEqual(feature.getId(), 533);
      assert.strictEqual(feature.get('prop0'), 'value0');

      assert.deepEqual(
        geometry.getExtent(),
        [
          -70.08100810081008, 12.417091709170947, -69.9009900990099,
          12.608069195591469,
        ],
      );
    });

    it('can read a feature with id equal to 0', function () {
      const features = format.readFeaturesFromObject(zeroId);
      assert.lengthOf(features, 1);

      const feature = features[0];
      assert.instanceOf(feature, Feature);
      assert.strictEqual(feature.getId(), 0);
    });

    it('can read a feature with null geometry', function () {
      const features = format.readFeaturesFromObject(nullGeometry);
      assert.lengthOf(features, 1);

      const feature = features[0];
      assert.instanceOf(feature, Feature);
      assert.strictEqual(feature.getGeometry(), null);
      assert.strictEqual(feature.getId(), 533);
      assert.strictEqual(feature.get('prop0'), 'value0');
    });
  });

  describe('#readFeatures()', function () {
    it('parses simple.json', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/simple.json',
        {encoding: 'utf8'},
      );

      const features = format.readFeatures(text);
      assert.strictEqual(features.length, 3);

      const point = features[0].getGeometry();
      assert.strictEqual(point.getType(), 'Point');
      assert.deepEqual(point.getFlatCoordinates(), [102, 0.5]);

      const line = features[1].getGeometry();
      assert.strictEqual(line.getType(), 'LineString');
      assert.deepEqual(
        line.getFlatCoordinates(),
        [102, 0, 103, 1, 104, 0, 105, 1],
      );

      const polygon = features[2].getGeometry();
      assert.strictEqual(polygon.getType(), 'Polygon');
      assert.deepEqual(
        polygon.getFlatCoordinates(),
        [100, 0, 100, 1, 101, 1, 101, 0, 100, 0],
      );
    });

    it('parses simple.json and transforms', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/simple.json',
        {encoding: 'utf8'},
      );
      const features = format.readFeatures(text, {
        featureProjection: 'EPSG:3857',
      });
      assert.strictEqual(features.length, 3);

      const point = features[0].getGeometry();
      assert.strictEqual(point.getType(), 'Point');
      assert.deepEqual(
        features[0].getGeometry().getCoordinates(),
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
      );

      const line = features[1].getGeometry();
      assert.strictEqual(line.getType(), 'LineString');
      assert.deepEqual(line.getCoordinates(), [
        transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
      ]);

      const polygon = features[2].getGeometry();
      assert.strictEqual(polygon.getType(), 'Polygon');
      assert.deepEqual(polygon.getCoordinates(), [
        [
          transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        ],
      ]);
    });

    it('parses world-110m.json', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/world-110m.json',
        {encoding: 'utf8'},
      );

      const features = format.readFeatures(text);
      assert.strictEqual(features.length, 178);

      const first = features[0];
      assert.instanceOf(first, Feature);
      const firstGeom = first.getGeometry();
      assert.instanceOf(firstGeom, MultiPolygon);
      assert.deepEqual(
        firstGeom.getExtent(),
        [-180, -85.60903777459777, 180, 83.64513000000002],
      );

      const last = features[177];
      assert.instanceOf(last, Feature);
      const lastGeom = last.getGeometry();
      assert.instanceOf(lastGeom, Polygon);
      assert.deepEqual(
        lastGeom.getExtent(),
        [
          25.26325263252633, -22.271802279310577, 32.848528485284874,
          -15.50833810039586,
        ],
      );
    });

    it("sets the topology's child names as feature property", async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/world-110m.json',
        {encoding: 'utf8'},
      );
      const format = new TopoJSON({
        layerName: 'layer',
      });
      const features = format.readFeatures(text);
      assert.strictEqual(features[0].get('layer'), 'land');
      assert.strictEqual(features[177].get('layer'), 'countries');
    });

    it("only parses features from specified topology's children", async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/world-110m.json',
        {encoding: 'utf8'},
      );
      const format = new TopoJSON({
        layers: ['land'],
      });
      const features = format.readFeatures(text);
      assert.strictEqual(features.length, 1);
    });
  });
});
