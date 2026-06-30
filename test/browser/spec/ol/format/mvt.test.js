import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import MVT from '../../../../../src/ol/format/MVT.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';

where('ArrayBuffer.isView').describe('ol.format.MVT', function () {
  let data;
  beforeEach(
    () =>
      new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'spec/ol/data/14-8938-5680.vector.pbf');
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () {
          data = xhr.response;
          resolve();
        };
        xhr.send();
      }),
  );

  describe('#readFeatures', function () {
    const options = {
      featureProjection: 'EPSG:3857',
      extent: [
        1824704.739223726, 6141868.096770482, 1827150.7241288517,
        6144314.081675608,
      ],
    };

    it('uses ol.render.Feature as feature class by default', function () {
      const format = new MVT({layers: ['water']});
      const features = format.readFeatures(data, options);
      assert.instanceOf(features[0], RenderFeature);
    });

    it('parses only specified layers', function () {
      const format = new MVT({layers: ['water']});
      const features = format.readFeatures(data, options);
      assert.strictEqual(features.length, 10);
    });

    it('parses geometries correctly', function () {
      const format = new MVT({
        featureClass: Feature,
        layers: ['poi_label'],
      });
      let geometry;

      geometry = format.readFeatures(data)[0].getGeometry();
      assert.strictEqual(geometry.getType(), 'Point');
      assert.deepEqual(geometry.getCoordinates(), [-1210, 2681]);

      format.setLayers(['water']);
      geometry = format.readFeatures(data)[0].getGeometry();
      assert.strictEqual(geometry.getType(), 'Polygon');
      assert.strictEqual(geometry.getCoordinates()[0].length, 10);
      assert.deepEqual(geometry.getCoordinates()[0][0], [1007, 2302]);

      format.setLayers(['barrier_line']);
      geometry = format.readFeatures(data)[0].getGeometry();
      assert.strictEqual(geometry.getType(), 'MultiLineString');
      assert.strictEqual(geometry.getCoordinates()[1].length, 6);
      assert.deepEqual(geometry.getCoordinates()[1][0], [4160, 3489]);
    });

    it('avoids unnecessary reprojections of the ol.render.Feature', function () {
      const format = new MVT({
        layers: ['poi_label'],
      });
      const geometry = format.readFeatures(data)[0].getGeometry();
      assert.strictEqual(geometry.getType(), 'Point');
      assert.deepEqual(geometry.getFlatCoordinates(), [-1210, 2681]);
    });

    it('parses id property', function () {
      // ol.Feature
      let format = new MVT({
        featureClass: Feature,
        layers: ['building'],
      });
      let features = format.readFeatures(data, options);
      assert.strictEqual(features[0].getId(), 2);
      // ol.render.Feature
      format = new MVT({
        layers: ['building'],
      });
      features = format.readFeatures(data, options);
      assert.strictEqual(features[0].getId(), 2);
    });

    it('accepts custom idProperty', function () {
      const format = new MVT({
        featureClass: Feature,
        layers: ['poi_label'],
        idProperty: 'osm_id',
      });
      const features = format.readFeatures(data, options);

      const first = features[0];
      assert.strictEqual(first.getId(), 1000000057590683);
      assert.strictEqual(first.get('osm_id'), undefined);
    });

    it('accepts custom idProperty (render features)', function () {
      const format = new MVT({
        layers: ['poi_label'],
        idProperty: 'osm_id',
      });

      const features = format.readFeatures(data, options);

      const first = features[0];
      assert.strictEqual(first.getId(), 1000000057590683);
      assert.strictEqual(first.get('osm_id'), undefined);
    });

    it('works if you provide a bogus idProperty', function () {
      const format = new MVT({
        layers: ['poi_label'],
        idProperty: 'bogus',
      });

      const features = format.readFeatures(data, options);

      const first = features[0];
      assert.strictEqual(first.getId(), undefined);
    });
  });
});

describe('ol.format.MVT', function () {
  const options = {
    featureProjection: 'EPSG:3857',
    extent: [
      1824704.739223726, 6141868.096770482, 1827150.7241288517,
      6144314.081675608,
    ],
  };

  describe('#createFeature_', function () {
    it('accepts a geometryName', function () {
      const format = new MVT({
        featureClass: Feature,
        geometryName: 'myGeom',
      });
      const rawFeature = {
        id: 1,
        properties: {
          geometry: 'foo',
        },
        type: 1,
        layer: {
          name: 'layer1',
        },
      };
      format.readRawGeometry_ = function (
        {},
        rawFeature,
        flatCoordinates,
        ends,
      ) {
        flatCoordinates.push(0, 0);
        ends.push(2);
      };
      const feature = format.createFeature_({}, rawFeature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Point);
      assert.equal(feature.get('myGeom'), geometry);
      assert.strictEqual(feature.get('geometry'), 'foo');
    });

    it('detects a Polygon', function () {
      const format = new MVT({
        featureClass: Feature,
      });
      const rawFeature = {
        type: 3,
        properties: {},
        layer: {
          name: 'layer1',
        },
      };
      format.readRawGeometry_ = function (
        {},
        rawFeature,
        flatCoordinates,
        ends,
      ) {
        flatCoordinates.push(0, 0, 3, 0, 3, 3, 0, 3, 0, 0);
        flatCoordinates.push(1, 1, 1, 2, 2, 2, 2, 1, 1, 1);
        ends.push(10, 20);
      };
      const feature = format.createFeature_({}, rawFeature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, Polygon);
    });

    it('detects a MultiPolygon', function () {
      const format = new MVT({
        featureClass: Feature,
      });
      const rawFeature = {
        type: 3,
        properties: {},
        layer: {
          name: 'layer1',
        },
      };
      format.readRawGeometry_ = function (
        {},
        rawFeature,
        flatCoordinates,
        ends,
      ) {
        flatCoordinates.push(0, 0, 1, 0, 1, 1, 0, 1, 0, 0);
        flatCoordinates.push(1, 1, 2, 1, 2, 2, 1, 2, 1, 1);
        ends.push(10, 20);
      };
      const feature = format.createFeature_({}, rawFeature);
      const geometry = feature.getGeometry();
      assert.instanceOf(geometry, MultiPolygon);
    });

    it('creates ol.render.Feature instances', function () {
      const format = new MVT();
      const rawFeature = {
        type: 3,
        properties: {
          foo: 'bar',
        },
        layer: {
          name: 'layer1',
        },
      };
      let createdFlatCoordinates;
      let createdEnds;
      format.readRawGeometry_ = function (
        {},
        rawFeature,
        flatCoordinates,
        ends,
      ) {
        flatCoordinates.push(0, 0, 1, 0, 1, 1, 1, 0, 0, 0);
        flatCoordinates.push(1, 1, 2, 1, 2, 2, 2, 1, 1, 1);
        createdFlatCoordinates = flatCoordinates;
        ends.push(10, 20);
        createdEnds = ends;
      };
      format.dataProjection.setExtent([0, 0, 4096, 4096]);
      format.dataProjection.setWorldExtent(options.extent);
      const feature = format.createFeature_(
        {},
        rawFeature,
        format.adaptOptions(options),
      );
      assert.instanceOf(feature, RenderFeature);
      assert.strictEqual(feature.getType(), 'Polygon');
      assert.equal(feature.getFlatCoordinates(), createdFlatCoordinates);
      assert.equal(feature.getEnds(), createdEnds);
      assert.strictEqual(feature.get('foo'), 'bar');
    });
  });
});
