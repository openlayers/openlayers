goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  var url = 'spec/ol/source/vectorsource/single-feature.json';

  describe('constructor', function() {
    it('creates an instance', function() {
      var source = new ol.source.Vector();
      expect(source).to.be.a(ol.source.Vector);
      expect(source).to.be.a(ol.source.Source);
    });

    it('accepts features', function() {
      var features = [new ol.Feature()];
      var source = new ol.source.Vector({
        features: features
      });
      expect(source).to.be.a(ol.source.Vector);
      expect(source.getFeatures()).to.eql(features);
    });

    it('accepts url and parser', function() {
      var source = new ol.source.Vector({
        url: url,
        parser: new ol.parser.GeoJSON()
      });
      expect(source).to.be.a(ol.source.Vector);
    });
  });

  describe('#load()', function() {
    it('triggers loading of features', function() {
      var source = new ol.source.Vector({
        url: url,
        parser: new ol.parser.GeoJSON()
      });
      expect(source.loadState_).to.be(ol.source.VectorLoadState.IDLE);
      var triggered = source.load([-1, -1, 1, 1], ol.proj.get('EPSG:4326'));
      expect(triggered).to.be(true);
      expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADING);
    });

    it('returns false when already loading', function() {
      var source = new ol.source.Vector({
        url: url,
        parser: new ol.parser.GeoJSON()
      });
      source.load([-1, -1, 1, 1], ol.proj.get('EPSG:4326'));
      // second call with same extent
      var triggered = source.load([-1, -1, 1, 1], ol.proj.get('EPSG:4326'));
      expect(triggered).to.be(false);
      expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADING);
    });
  });

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var source = new ol.source.Vector();
      var features = [new ol.Feature()];
      source.addFeatures(features);
      expect(source.getFeatures()).to.eql(features);
    });
  });

  describe('featurechange event', function() {

    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector();
      source.addFeatures(features);
    });

    it('is dispatched on attribute changes', function(done) {
      goog.events.listen(source, ol.source.VectorEventType.CHANGE,
          function(evt) {
            var expected = features[0];
            expect(evt.features[0]).to.be(expected);
            expect(evt.extents[0]).to.eql(expected.getGeometry().getBounds());
            done();

          });

      features[0].set('foo', 'bar');
    });

  });

});

describe('ol.source.FeatureCache', function() {

  describe('#getFeaturesObject()', function() {
    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector();
      source.addFeatures(features);
    });

    it('returns the features in an object', function() {
      var featuresObject = source.featureCache_.getFeaturesObject();
      expect(goog.object.getCount(featuresObject)).to.eql(features.length);
    });

  });

});

goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.parser.GeoJSON');
goog.require('ol.proj');
goog.require('ol.source.FeatureCache');
goog.require('ol.source.Source');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('ol.source.VectorLoadState');
