import Feature from '../../../../src/ol/Feature.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import Cluster from '../../../../src/ol/source/Cluster.js';
import Source from '../../../../src/ol/source/Source.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

describe('ol.source.Cluster', () => {

  describe('constructor', () => {
    test('returns a cluster source', () => {
      const source = new Cluster({
        projection: getProjection('EPSG:4326'),
        source: new VectorSource()
      });
      expect(source).toBeInstanceOf(Source);
      expect(source).toBeInstanceOf(Cluster);
      expect(source.getDistance()).toBe(20);
    });
  });

  describe('#loadFeatures', () => {
    const extent = [-1, -1, 1, 1];
    const projection = getProjection('EPSG:3857');
    test('clusters a source with point features', () => {
      const source = new Cluster({
        source: new VectorSource({
          features: [
            new Feature(new Point([0, 0])),
            new Feature(new Point([0, 0]))
          ]
        })
      });
      source.loadFeatures(extent, 1, projection);
      expect(source.getFeatures().length).toBe(1);
      expect(source.getFeatures()[0].get('features').length).toBe(2);
    });
    test('clusters with a custom geometryFunction', () => {
      const source = new Cluster({
        geometryFunction: function(feature) {
          const geom = feature.getGeometry();
          if (geom.getType() == 'Point') {
            return geom;
          } else if (geom.getType() == 'Polygon') {
            return geom.getInteriorPoint();
          }
          return null;
        },
        source: new VectorSource({
          features: [
            new Feature(new Point([0, 0])),
            new Feature(new LineString([[0, 0], [1, 1]])),
            new Feature(new Polygon(
              [[[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]]))
          ]
        })
      });
      source.loadFeatures(extent, 1, projection);
      expect(source.getFeatures().length).toBe(1);
      expect(source.getFeatures()[0].get('features').length).toBe(2);
    });
  });

  describe('#setDistance', () => {
    test('changes the distance value', () => {
      const source = new Cluster({
        distance: 100,
        source: new VectorSource()
      });
      expect(source.getDistance()).toBe(100);
      source.setDistance(10);
      expect(source.getDistance()).toBe(10);
    });
  });

});
