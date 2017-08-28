

goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.format.MVT');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.render.Feature');

where('ArrayBuffer.isView').describe('ol.format.MVT', function() {

  var data;
  beforeEach(function(done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'spec/ol/data/14-8938-5680.vector.pbf');
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      data = xhr.response;
      done();
    };
    xhr.send();
  });

  describe('#readFeatures', function() {

    it('uses ol.render.Feature as feature class by default', function() {
      var format = new ol.format.MVT({layers: ['water']});
      var features = format.readFeatures(data);
      expect(features[0]).to.be.a(ol.render.Feature);
    });

    it('parses only specified layers', function() {
      var format = new ol.format.MVT({layers: ['water']});
      var features = format.readFeatures(data);
      expect(features.length).to.be(10);
    });

    it('parses geometries correctly', function() {
      var format = new ol.format.MVT({
        featureClass: ol.Feature,
        layers: ['poi_label']
      });
      var geometry;

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
      var format = new ol.format.MVT({
        featureClass: ol.Feature,
        layers: ['building']
      });
      var features = format.readFeatures(data);
      expect(features[0].getId()).to.be(2);
      // ol.render.Feature
      format = new ol.format.MVT({
        layers: ['building']
      });
      features = format.readFeatures(data);
      expect(features[0].getId()).to.be(2);
    });

    it('sets the extent of the last readFeatures call', function() {
      var format = new ol.format.MVT();
      format.readFeatures(data);
      var extent = format.getLastExtent();
      expect(ol.extent.getWidth(extent)).to.be(4096);
    });

  });

});

describe('ol.format.MVT', function() {

  describe('#createFeature_', function() {
    it('accepts a geometryName', function() {
      var format = new ol.format.MVT({
        featureClass: ol.Feature,
        geometryName: 'myGeom'
      });
      var rawFeature = {
        id: 1,
        properties: {
          geometry: 'foo'
        },
        type: 1,
        layer: {
          name: 'layer1'
        }
      };
      var readRawGeometry_ = ol.format.MVT.readRawGeometry_;
      ol.format.MVT.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0);
        ends.push(2);
      };
      var feature = format.createFeature_({}, rawFeature);
      ol.format.MVT.readRawGeometry_ = readRawGeometry_;
      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.Point);
      expect(feature.get('myGeom')).to.equal(geometry);
      expect(feature.get('geometry')).to.be('foo');
    });

    it('detects a Polygon', function() {
      var format = new ol.format.MVT({
        featureClass: ol.Feature
      });
      var rawFeature = {
        type: 3,
        properties: {},
        layer: {
          name: 'layer1'
        }
      };
      var readRawGeometry_ = ol.format.MVT.readRawGeometry_;
      ol.format.MVT.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0, 3, 0, 3, 3, 3, 0, 0, 0);
        flatCoordinates.push(1, 1, 1, 2, 2, 2, 2, 1, 1, 1);
        ends.push(10, 20);
      };
      var feature = format.createFeature_({}, rawFeature);
      ol.format.MVT.readRawGeometry_ = readRawGeometry_;
      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.Polygon);
    });

    it('detects a MultiPolygon', function() {
      var format = new ol.format.MVT({
        featureClass: ol.Feature
      });
      var rawFeature = {
        type: 3,
        properties: {},
        layer: {
          name: 'layer1'
        }
      };
      var readRawGeometry_ = ol.format.MVT.readRawGeometry_;
      ol.format.MVT.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0, 1, 0, 1, 1, 1, 0, 0, 0);
        flatCoordinates.push(1, 1, 2, 1, 2, 2, 2, 1, 1, 1);
        ends.push(10, 20);
      };
      var feature = format.createFeature_({}, rawFeature);
      ol.format.MVT.readRawGeometry_ = readRawGeometry_;
      var geometry = feature.getGeometry();
      expect(geometry).to.be.a(ol.geom.MultiPolygon);
    });

    it('creates ol.render.Feature instances', function() {
      var format = new ol.format.MVT();
      var rawFeature = {
        type: 3,
        properties: {
          foo: 'bar'
        },
        layer: {
          name: 'layer1'
        }
      };
      var readRawGeometry_ = ol.format.MVT.readRawGeometry_;
      var createdFlatCoordinates;
      var createdEnds;
      ol.format.MVT.readRawGeometry_ = function({}, rawFeature, flatCoordinates, ends) {
        flatCoordinates.push(0, 0, 1, 0, 1, 1, 1, 0, 0, 0);
        flatCoordinates.push(1, 1, 2, 1, 2, 2, 2, 1, 1, 1);
        createdFlatCoordinates = flatCoordinates;
        ends.push(10, 20);
        createdEnds = ends;
      };
      var feature = format.createFeature_({}, rawFeature);
      ol.format.MVT.readRawGeometry_ = readRawGeometry_;
      expect(feature).to.be.a(ol.render.Feature);
      expect(feature.getType()).to.be('Polygon');
      expect(feature.getFlatCoordinates()).to.equal(createdFlatCoordinates);
      expect(feature.getEnds()).to.equal(createdEnds);
      expect(feature.get('foo')).to.be('bar');
    });

  });

});
