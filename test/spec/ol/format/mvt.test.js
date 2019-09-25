import Feature from '../../../../src/ol/Feature.js';
import MVT from '../../../../src/ol/format/MVT.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import RenderFeature from '../../../../src/ol/render/Feature.js';

where('ArrayBuffer.isView').describe('ol.format.MVT', function() {

  let data;
  beforeEach(done => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'spec/ol/data/14-8938-5680.vector.pbf');
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      data = xhr.response;
      done();
    };
    xhr.send();
  });

  describe('#readFeatures', () => {

    const options = {
      featureProjection: 'EPSG:3857',
      extent: [1824704.739223726, 6141868.096770482, 1827150.7241288517, 6144314.081675608]
    };

    test('uses ol.render.Feature as feature class by default', () => {
      const format = new MVT({layers: ['water']});
      const features = format.readFeatures(data, options);
      expect(features[0]).toBeInstanceOf(RenderFeature);
    });

    test('parses only specified layers', () => {
      const format = new MVT({layers: ['water']});
      const features = format.readFeatures(data, options);
      expect(features.length).toBe(10);
    });

    test('parses geometries correctly', () => {
      const format = new MVT({
        featureClass: Feature,
        layers: ['poi_label']
      });
      let geometry;

      geometry = format.readFeatures(data)[0].getGeometry();
      expect(geometry.getType()).toBe('Point');
      expect(geometry.getCoordinates()).toEqual([-1210, 2681]);

      format.setLayers(['water']);
      geometry = format.readFeatures(data)[0].getGeometry();
      expect(geometry.getType()).toBe('Polygon');
      expect(geometry.getCoordinates()[0].length).toBe(10);
      expect(geometry.getCoordinates()[0][0]).toEqual([1007, 2302]);

      format.setLayers(['barrier_line']);
      geometry = format.readFeatures(data)[0].getGeometry();
      expect(geometry.getType()).toBe('MultiLineString');
      expect(geometry.getCoordinates()[1].length).toBe(6);
      expect(geometry.getCoordinates()[1][0]).toEqual([4160, 3489]);
    });

    test('parses id property', () => {
      // ol.Feature
      let format = new MVT({
        featureClass: Feature,
        layers: ['building']
      });
      let features = format.readFeatures(data, options);
      expect(features[0].getId()).toBe(2);
      // ol.render.Feature
      format = new MVT({
        layers: ['building']
      });
      features = format.readFeatures(data, options);
      expect(features[0].getId()).toBe(2);
    });

    test('accepts custom idProperty', () => {
      const format = new MVT({
        featureClass: Feature,
        layers: ['poi_label'],
        idProperty: 'osm_id'
      });
      const features = format.readFeatures(data, options);

      const first = features[0];
      expect(first.getId()).toBe(1000000057590683);
      expect(first.get('osm_id')).toBe(undefined);
    });

    test('accepts custom idProperty (render features)', () => {
      const format = new MVT({
        layers: ['poi_label'],
        idProperty: 'osm_id'
      });

      const features = format.readFeatures(data, options);

      const first = features[0];
      expect(first.getId()).toBe(1000000057590683);
      expect(first.get('osm_id')).toBe(undefined);
    });

    test('works if you provide a bogus idProperty', () => {
      const format = new MVT({
        layers: ['poi_label'],
        idProperty: 'bogus'
      });

      const features = format.readFeatures(data, options);

      const first = features[0];
      expect(first.getId()).toBe(undefined);
    });

  });

});

describe('ol.format.MVT', () => {

  const options = {
    featureProjection: 'EPSG:3857',
    extent: [1824704.739223726, 6141868.096770482, 1827150.7241288517, 6144314.081675608]
  };

  describe('#createFeature_', () => {
    test('accepts a geometryName', () => {
      const format = new MVT({
        featureClass: Feature,
        geometryName: 'myGeom'
      });
      const rawFeature = {
        id: 1,
        properties: {
          geometry: 'foo'
        },
        type: 1,
        layer: {
          name: 'layer1'
        }
      };
      format.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0);
        ends.push(2);
      };
      const feature = format.createFeature_({}, rawFeature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Point);
      expect(feature.get('myGeom')).toBe(geometry);
      expect(feature.get('geometry')).toBe('foo');
    });

    test('detects a Polygon', () => {
      const format = new MVT({
        featureClass: Feature
      });
      const rawFeature = {
        type: 3,
        properties: {},
        layer: {
          name: 'layer1'
        }
      };
      format.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0, 3, 0, 3, 3, 3, 0, 0, 0);
        flatCoordinates.push(1, 1, 1, 2, 2, 2, 2, 1, 1, 1);
        ends.push(10, 20);
      };
      const feature = format.createFeature_({}, rawFeature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(Polygon);
    });

    test('detects a MultiPolygon', () => {
      const format = new MVT({
        featureClass: Feature
      });
      const rawFeature = {
        type: 3,
        properties: {},
        layer: {
          name: 'layer1'
        }
      };
      format.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0, 1, 0, 1, 1, 1, 0, 0, 0);
        flatCoordinates.push(1, 1, 2, 1, 2, 2, 2, 1, 1, 1);
        ends.push(10, 20);
      };
      const feature = format.createFeature_({}, rawFeature);
      const geometry = feature.getGeometry();
      expect(geometry).toBeInstanceOf(MultiPolygon);
    });

    test('creates ol.render.Feature instances', () => {
      const format = new MVT();
      const rawFeature = {
        type: 3,
        properties: {
          foo: 'bar'
        },
        layer: {
          name: 'layer1'
        }
      };
      let createdFlatCoordinates;
      let createdEnds;
      format.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0, 1, 0, 1, 1, 1, 0, 0, 0);
        flatCoordinates.push(1, 1, 2, 1, 2, 2, 2, 1, 1, 1);
        createdFlatCoordinates = flatCoordinates;
        ends.push(10, 20);
        createdEnds = ends;
      };
      format.dataProjection.setExtent([0, 0, 4096, 4096]);
      format.dataProjection.setWorldExtent(options.extent);
      const feature = format.createFeature_({}, rawFeature, format.adaptOptions(options));
      expect(feature).toBeInstanceOf(RenderFeature);
      expect(feature.getType()).toBe('Polygon');
      expect(feature.getFlatCoordinates()).toBe(createdFlatCoordinates);
      expect(feature.getEnds()).toBe(createdEnds);
      expect(feature.get('foo')).toBe('bar');
    });

  });

});
