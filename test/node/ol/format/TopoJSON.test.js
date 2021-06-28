import Feature from '../../../../src/ol/Feature.js';
import FeatureFormat from '../../../../src/ol/format/Feature.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import TopoJSON from '../../../../src/ol/format/TopoJSON.js';
import expect from '../../expect.js';
import fse from 'fs-extra';
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
      expect(format).to.be.a(FeatureFormat);
      expect(format).to.be.a(TopoJSON);
    });
  });

  describe('#readFeaturesFromTopology_()', function () {
    it('creates an array of features from a topology', function () {
      const features = format.readFeaturesFromObject(aruba);
      expect(features).to.have.length(1);

      const feature = features[0];
      expect(feature).to.be.a(Feature);

      const geometry = feature.getGeometry();
      expect(geometry).to.be.a(Polygon);

      // Parses identifier
      expect(feature.getId()).to.be(533);
      // Parses properties
      expect(feature.get('prop0')).to.be('value0');

      expect(geometry.getExtent()).to.eql([
        -70.08100810081008, 12.417091709170947, -69.9009900990099,
        12.608069195591469,
      ]);
    });

    it('can read a feature with id equal to 0', function () {
      const features = format.readFeaturesFromObject(zeroId);
      expect(features).to.have.length(1);

      const feature = features[0];
      expect(feature).to.be.a(Feature);
      expect(feature.getId()).to.be(0);
    });

    it('can read a feature with null geometry', function () {
      const features = format.readFeaturesFromObject(nullGeometry);
      expect(features).to.have.length(1);

      const feature = features[0];
      expect(feature).to.be.a(Feature);
      expect(feature.getGeometry()).to.be(null);
      expect(feature.getId()).to.be(533);
      expect(feature.get('prop0')).to.be('value0');
    });
  });

  describe('#readFeatures()', function () {
    it('parses simple.json', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/simple.json',
        {encoding: 'utf8'}
      );

      const features = format.readFeatures(text);
      expect(features.length).to.be(3);

      const point = features[0].getGeometry();
      expect(point.getType()).to.be('Point');
      expect(point.getFlatCoordinates()).to.eql([102, 0.5]);

      const line = features[1].getGeometry();
      expect(line.getType()).to.be('LineString');
      expect(line.getFlatCoordinates()).to.eql([
        102, 0, 103, 1, 104, 0, 105, 1,
      ]);

      const polygon = features[2].getGeometry();
      expect(polygon.getType()).to.be('Polygon');
      expect(polygon.getFlatCoordinates()).to.eql([
        100, 0, 100, 1, 101, 1, 101, 0, 100, 0,
      ]);
    });

    it('parses simple.json and transforms', async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/simple.json',
        {encoding: 'utf8'}
      );
      const features = format.readFeatures(text, {
        featureProjection: 'EPSG:3857',
      });
      expect(features.length).to.be(3);

      const point = features[0].getGeometry();
      expect(point.getType()).to.be('Point');
      expect(features[0].getGeometry().getCoordinates()).to.eql(
        transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857')
      );

      const line = features[1].getGeometry();
      expect(line.getType()).to.be('LineString');
      expect(line.getCoordinates()).to.eql([
        transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
        transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
        transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
      ]);

      const polygon = features[2].getGeometry();
      expect(polygon.getType()).to.be('Polygon');
      expect(polygon.getCoordinates()).to.eql([
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
        {encoding: 'utf8'}
      );

      const features = format.readFeatures(text);
      expect(features.length).to.be(178);

      const first = features[0];
      expect(first).to.be.a(Feature);
      const firstGeom = first.getGeometry();
      expect(firstGeom).to.be.a(MultiPolygon);
      expect(firstGeom.getExtent()).to.eql([
        -180, -85.60903777459777, 180, 83.64513000000002,
      ]);

      const last = features[177];
      expect(last).to.be.a(Feature);
      const lastGeom = last.getGeometry();
      expect(lastGeom).to.be.a(Polygon);
      expect(lastGeom.getExtent()).to.eql([
        25.26325263252633, -22.271802279310577, 32.848528485284874,
        -15.50833810039586,
      ]);
    });

    it("sets the topology's child names as feature property", async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/world-110m.json',
        {encoding: 'utf8'}
      );
      const format = new TopoJSON({
        layerName: 'layer',
      });
      const features = format.readFeatures(text);
      expect(features[0].get('layer')).to.be('land');
      expect(features[177].get('layer')).to.be('countries');
    });

    it("only parses features from specified topology's children", async () => {
      const text = await fse.readFile(
        'test/node/ol/format/TopoJSON/world-110m.json',
        {encoding: 'utf8'}
      );
      const format = new TopoJSON({
        layers: ['land'],
      });
      const features = format.readFeatures(text);
      expect(features.length).to.be(1);
    });
  });
});
