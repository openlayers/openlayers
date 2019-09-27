import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import EventType from '../../../../../src/ol/events/EventType.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import Cluster from '../../../../../src/ol/source/Cluster.js';
import Source from '../../../../../src/ol/source/Source.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

describe('ol.source.Cluster', function () {
  describe('constructor', function () {
    it('returns a cluster source', function () {
      const source = new Cluster({
        projection: getProjection('EPSG:4326'),
        source: new VectorSource(),
      });
      assert.instanceOf(source, Source);
      assert.instanceOf(source, Cluster);
      assert.strictEqual(source.getDistance(), 20);
    });
  });

  describe('#loadFeatures', function () {
    const extent = [-1, -1, 1, 1];
    const projection = getProjection('EPSG:3857');
    it('clusters a source with point features', function () {
      const source = new Cluster({
        source: new VectorSource({
          features: [
            new Feature(new Point([0, 0])),
            new Feature(new Point([0, 0])),
          ],
        }),
      });
      source.loadFeatures(extent, 1, projection);
      assert.strictEqual(source.getFeatures().length, 1);
      assert.strictEqual(source.getFeatures()[0].get('features').length, 2);
    });
    it('clusters a source with point and null features', function () {
      const source = new Cluster({
        source: new VectorSource({
          features: [new Feature(new Point([0, 0])), new Feature()],
        }),
      });
      source.loadFeatures(extent, 1, projection);
      assert.strictEqual(source.getFeatures().length, 1);
      assert.strictEqual(source.getFeatures()[0].get('features').length, 1);
    });
    it('clusters with a custom geometryFunction', function () {
      const source = new Cluster({
        geometryFunction: function (feature) {
          const geom = feature.getGeometry();
          if (geom.getType() == 'Point') {
            return geom;
          }
          if (geom.getType() == 'Polygon') {
            return geom.getInteriorPoint();
          }
          return null;
        },
        source: new VectorSource({
          features: [
            new Feature(new Point([0, 0])),
            new Feature(
              new LineString([
                [0, 0],
                [1, 1],
              ]),
            ),
            new Feature(
              new Polygon([
                [
                  [-1, -1],
                  [-1, 1],
                  [1, 1],
                  [1, -1],
                  [-1, -1],
                ],
              ]),
            ),
          ],
        }),
      });
      source.loadFeatures(extent, 1, projection);
      assert.strictEqual(source.getFeatures().length, 1);
      assert.strictEqual(source.getFeatures()[0].get('features').length, 2);
    });
    it('custom cluster feature with additional fields', function () {
      const feature1 = new Feature(new Point([0, 0]));
      const feature2 = new Feature(new Point([0, 0]));
      feature1.set('value', 1);
      feature2.set('value', 2);
      const source = new Cluster({
        source: new VectorSource({
          features: [feature1, feature2],
        }),
        createCluster: function (clusterPoint, features) {
          let sum = 0;
          for (const ft of features) {
            sum += ft.get('value');
          }
          return new Feature({
            geometry: clusterPoint,
            sum: sum,
          });
        },
      });
      source.loadFeatures(extent, 1, projection);
      assert.strictEqual(source.getFeatures().length, 1);
      assert.strictEqual(source.getFeatures()[0].get('sum'), 3);
    });
  });

  describe('#setDistance', function () {
    it('changes the distance value', function () {
      const source = new Cluster({
        distance: 100,
        source: new VectorSource(),
      });
      assert.strictEqual(source.getDistance(), 100);
      source.setDistance(10);
      assert.strictEqual(source.getDistance(), 10);
    });
  });
});

describe('#setSource', function () {
  it('removes the change listener from the old source', function () {
    const source = new VectorSource();
    const clusterSource = new Cluster({
      source: source,
    });
    assert.strictEqual(source.hasListener(EventType.CHANGE), true);
    clusterSource.setSource(null);
    assert.strictEqual(source.hasListener(EventType.CHANGE), false);
  });

  it('properly removes the previous features', function () {
    const source = new Cluster({
      source: new VectorSource({
        features: [new Feature(new Point([0, 0]))],
      }),
    });

    const projection = getProjection('EPSG:3857');
    const extent = [-1, -1, 1, 1];
    source.loadFeatures(extent, 1, projection);

    assert.strictEqual(source.features.length, 1);
    source.setSource(null);
    assert.strictEqual(source.features.length, 0);
  });
});
