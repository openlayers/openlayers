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

  describe('#getFeatures()', function() {

    it('gets features cached on the source', function() {
      var source = new ol.source.Vector({
        features: [new ol.Feature()]
      });
      source.addFeatures([new ol.Feature()]);

      var features = source.getFeatures();
      expect(features).to.be.an('array');
      expect(features).to.have.length(2);
    });

    it('accepts a filter function', function() {
      var features = [
        new ol.Feature({name: 'a'}),
        new ol.Feature({name: 'b'}),
        new ol.Feature({name: 'c'}),
        new ol.Feature({name: 'd'})
      ];
      var source = new ol.source.Vector({features: features});

      var results = source.getFeatures(function(feature) {
        return feature.get('name') > 'b';
      });

      expect(results).to.be.an('array');
      expect(results).to.have.length(2);
      expect(results).to.contain(features[2]);
      expect(results).to.contain(features[3]);
    });

  });

  describe('#forEachFeatureInExtent()', function() {

    var features = [
      new ol.Feature({geom: new ol.geom.Point([-100, 50])}),
      new ol.Feature({geom: new ol.geom.Point([100, 50])}),
      new ol.Feature({geom: new ol.geom.Point([100, -50])}),
      new ol.Feature({geom: new ol.geom.Point([-100, -50])})
    ];
    var source = new ol.source.Vector({features: features});
    var gg = ol.proj.get('EPSG:4326');

    it('calls callback with each feature in the extent', function() {
      var callback = sinon.spy();
      source.forEachFeatureInExtent([-180, -90, 180, 90], gg, callback);
      expect(callback.callCount).to.be(4);
      expect(callback.calledWith(sinon.match.same(features[0]))).to.be(true);
      expect(callback.calledWith(sinon.match.same(features[1]))).to.be(true);
      expect(callback.calledWith(sinon.match.same(features[2]))).to.be(true);
      expect(callback.calledWith(sinon.match.same(features[3]))).to.be(true);
    });

    it('accepts a this argument', function() {
      var callback = sinon.spy();
      var thisArg = {};
      source.forEachFeatureInExtent(
          [-180, -90, 180, 90], gg, callback, thisArg);
      expect(callback.calledOn(thisArg)).to.be(true);
    });

    it('works with a subset of features', function() {
      var callback = sinon.spy();
      source.forEachFeatureInExtent([-100, -50, -100, 50], gg, callback);
      expect(callback.callCount).to.be(2);
      expect(callback.calledWith(sinon.match.same(features[0]))).to.be(true);
      expect(callback.calledWith(sinon.match.same(features[3]))).to.be(true);
    });

    it('works with no features', function() {
      var callback = sinon.spy();
      source.forEachFeatureInExtent([-110, -50, -110, -50], gg, callback);
      expect(callback.called).to.be(false);
    });

  });

  describe('featureload event', function() {

    var gg = ol.proj.get('EPSG:4326');
    var world = [-180, -90, 180, 90];

    it('is dispatched after features load', function(done) {
      var source = new ol.source.Vector({
        url: url,
        parser: new ol.parser.GeoJSON()
      });
      expect(source.loadState_).to.be(ol.source.VectorLoadState.IDLE);
      var triggered = source.load(world, gg);
      expect(triggered).to.be(true);
      expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADING);
      goog.events.listen(source, ol.source.VectorEventType.LOAD,
          function(evt) {
            var features = evt.features;
            expect(features).to.be.an('array');
            expect(features).to.have.length(1);
            expect(features[0]).to.be.an(ol.Feature);

            var extents = evt.extents;
            expect(extents).to.be.an('array');
            expect(extents).to.have.length(1);
            expect(extents[0]).to.be.eql([1, 2, 1, 2]);

            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            done();
          });
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
