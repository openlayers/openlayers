import Feature from '../../../../src/ol/Feature.js';
import MVT from '../../../../src/ol/format/MVT.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import RenderFeature from '../../../../src/ol/render/Feature.js';

where('ArrayBuffer.isView').describe('ol.format.MVT', function() {

  let data;
  beforeEach(function(done) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'spec/ol/data/14-8938-5680.vector.pbf');
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      data = xhr.response;
      done();
    };
    xhr.send();
  });

  describe('#readFeatures', function() {

    const options = {
      featureProjection: 'EPSG:3857',
      extent: [1824704.739223726, 6141868.096770482, 1827150.7241288517, 6144314.081675608]
    };

    it('uses ol.render.Feature as feature class by default', function() {
      const format = new MVT({layers: ['water']});
      const features = format.readFeatures(data, options);
      expect(features[0]).to.be.a(RenderFeature);
    });

    it('parses only specified layers', function() {
      const format = new MVT({layers: ['water']});
      const features = format.readFeatures(data, options);
      expect(features.length).to.be(10);
    });

    it('parses geometries correctly', function() {
      const format = new MVT({
        featureClass: Feature,
        layers: ['poi_label']
      });
      let geometry;

      geometry = format.readFeatures(data)[0].getGeometry();
      expect(geometry.getType()).to.be('Point');
      expect(geometry.getCoordinates()).to.eql([-1210, 2681]);

      format.setLayers(['water']);
      geometry = format.readFeatures(data)[0].getGeometry();
      expect(geometry.getType()).to.be('Polygon');
      expect(geometry.getCoordinates()[0].length).to.be(10);
      expect(geometry.getCoordinates()[0][0]).to.eql([1007, 2302]);

      format.setLayers(['barrier_line']);
      geometry = format.readFeatures(data)[0].getGeometry();
      expect(geometry.getType()).to.be('MultiLineString');
      expect(geometry.getCoordinates()[1].length).to.be(6);
      expect(geometry.getCoordinates()[1][0]).to.eql([4160, 3489]);
    });

    it('parses id property', function() {
      // ol.Feature
      let format = new MVT({
        featureClass: Feature,
        layers: ['building']
      });
      let features = format.readFeatures(data, options);
      expect(features[0].getId()).to.be(2);
      // ol.render.Feature
      format = new MVT({
        layers: ['building']
      });
      features = format.readFeatures(data, options);
      expect(features[0].getId()).to.be(2);
    });

  });

});

describe('ol.format.MVT', function() {

  const options = {
    featureProjection: 'EPSG:3857',
    extent: [1824704.739223726, 6141868.096770482, 1827150.7241288517, 6144314.081675608]
  };

  describe('#createFeature_', function() {
    it('accepts a geometryName', function() {
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
      expect(geometry).to.be.a(Point);
      expect(feature.get('myGeom')).to.equal(geometry);
      expect(feature.get('geometry')).to.be('foo');
    });

    it('detects a Polygon', function() {
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
      expect(geometry).to.be.a(Polygon);
    });

    it('detects a MultiPolygon', function() {
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
      expect(geometry).to.be.a(MultiPolygon);
    });

    it('creates ol.render.Feature instances', function() {
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
      expect(feature).to.be.a(RenderFeature);
      expect(feature.getType()).to.be('Polygon');
      expect(feature.getFlatCoordinates()).to.equal(createdFlatCoordinates);
      expect(feature.getEnds()).to.equal(createdEnds);
      expect(feature.get('foo')).to.be('bar');
    });

  });

});
