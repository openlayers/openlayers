import Feature from '../../../../src/ol/Feature.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import FeatureFormat from '../../../../src/ol/format/Feature.js';
import {transform} from '../../../../src/ol/proj.js';
import TopoJSON from '../../../../src/ol/format/TopoJSON.js';

const aruba = {
  type: 'Topology',
  transform: {
    scale: [0.036003600360036005, 0.017361589674592462],
    translate: [-180, -89.99892578124998]
  },
  objects: {
    aruba: {
      type: 'Polygon',
      properties: {
        prop0: 'value0'
      },
      arcs: [[0]],
      id: 533
    }
  },
  arcs: [
    [[3058, 5901], [0, -2], [-2, 1], [-1, 3], [-2, 3], [0, 3], [1, 1], [1, -3],
      [2, -5], [1, -1]]
  ]
};

const zeroId = {
  type: 'Topology',
  objects: {
    foobar: {
      type: 'Point',
      id: 0,
      coordinates: [0, 42]
    }
  }
};

describe('ol.format.TopoJSON', () => {

  let format;
  beforeAll(function() {
    format = new TopoJSON();
  });

  describe('constructor', () => {
    test('creates a new format', () => {
      expect(format).toBeInstanceOf(FeatureFormat);
      expect(format).toBeInstanceOf(TopoJSON);
    });
  });

  describe('#readFeaturesFromTopology_()', () => {

    test('creates an array of features from a topology', () => {
      const features = format.readFeaturesFromObject(aruba);
      expect(features).toHaveLength(1);

      const feature = features[0];
      expect(feature).toBeInstanceOf(Feature);

      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);

      expect(feature.getId()).toBe(533);
      expect(feature.get('prop0')).toBe('value0');

      expect(geometry.getExtent()).toEqual([
        -70.08100810081008, 12.417091709170947,
        -69.9009900990099, 12.608069195591469
      ]);
    });

    test('can read a feature with id equal to 0', () => {
      const features = format.readFeaturesFromObject(zeroId);
      expect(features).toHaveLength(1);

      const feature = features[0];
      expect(feature).toBeInstanceOf(Feature);
      expect(feature.getId()).toBe(0);
    });

  });

  describe('#readFeatures()', () => {

    test('parses simple.json', done => {
      afterLoadText('spec/ol/format/topojson/simple.json', function(text) {
        const features = format.readFeatures(text);
        expect(features.length).toBe(3);

        const point = features[0].getGeometry();
        expect(point.getType()).toBe('Point');
        expect(point.getFlatCoordinates()).toEqual([102, 0.5]);

        const line = features[1].getGeometry();
        expect(line.getType()).toBe('LineString');
        expect(line.getFlatCoordinates()).toEqual([
          102, 0, 103, 1, 104, 0, 105, 1
        ]);

        const polygon = features[2].getGeometry();
        expect(polygon.getType()).toBe('Polygon');
        expect(polygon.getFlatCoordinates()).toEqual([
          100, 0, 100, 1, 101, 1, 101, 0, 100, 0
        ]);

        done();
      });
    });

    test('parses simple.json and transforms', done => {
      afterLoadText('spec/ol/format/topojson/simple.json', function(text) {
        const features = format.readFeatures(text, {
          featureProjection: 'EPSG:3857'
        });
        expect(features.length).toBe(3);

        const point = features[0].getGeometry();
        expect(point.getType()).toBe('Point');
        expect(features[0].getGeometry().getCoordinates()).toEqual(transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'));

        const line = features[1].getGeometry();
        expect(line.getType()).toBe('LineString');
        expect(line.getCoordinates()).toEqual([
          transform([102.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([103.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([104.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([105.0, 1.0], 'EPSG:4326', 'EPSG:3857')
        ]);

        const polygon = features[2].getGeometry();
        expect(polygon.getType()).toBe('Polygon');
        expect(polygon.getCoordinates()).toEqual([[
          transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([100.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([101.0, 1.0], 'EPSG:4326', 'EPSG:3857'),
          transform([101.0, 0.0], 'EPSG:4326', 'EPSG:3857'),
          transform([100.0, 0.0], 'EPSG:4326', 'EPSG:3857')
        ]]);

        done();
      });
    });

    test('parses world-110m.json', done => {
      afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {

        const features = format.readFeatures(text);
        expect(features.length).toBe(178);

        const first = features[0];
        expect(first).toBeInstanceOf(Feature);
        const firstGeom = first.getGeometry();
        expect(firstGeom).toBeInstanceOf(MultiPolygon);
        expect(firstGeom.getExtent()).toEqual([-180, -85.60903777459777, 180, 83.64513000000002]);

        const last = features[177];
        expect(last).toBeInstanceOf(Feature);
        const lastGeom = last.getGeometry();
        expect(lastGeom).toBeInstanceOf(Polygon);
        expect(lastGeom.getExtent()).toEqual([
          25.26325263252633, -22.271802279310577,
          32.848528485284874, -15.50833810039586
        ]);

        done();
      });
    });

    test('sets the topology\'s child names as feature property', done => {
      afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {
        const format = new TopoJSON({
          layerName: 'layer'
        });
        const features = format.readFeatures(text);
        expect(features[0].get('layer')).toBe('land');
        expect(features[177].get('layer')).toBe('countries');
        done();
      });
    });

    test(
      'only parses features from specified topology\'s children',
      done => {
        afterLoadText('spec/ol/format/topojson/world-110m.json', function(text) {
          const format = new TopoJSON({
            layers: ['land']
          });
          const features = format.readFeatures(text);
          expect(features.length).toBe(1);
          done();
        });
      }
    );

  });

});
