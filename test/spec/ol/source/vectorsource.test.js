goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  var pointFeature;
  var infiniteExtent;
  beforeEach(function() {
    pointFeature = new ol.Feature(new ol.geom.Point([0, 0]));
    infiniteExtent = [-Infinity, -Infinity, Infinity, Infinity];
  });

  describe('when empty', function() {

    var vectorSource;
    beforeEach(function() {
      vectorSource = new ol.source.Vector();
    });

    describe('#forEachFeatureInExtent', function() {

      it('does not call the callback', function() {
        var f = sinon.spy();
        vectorSource.forEachFeatureInExtent(infiniteExtent, f);
        expect(f).not.to.be.called();
      });

    });

    describe('#getFeaturesInExtent', function() {

      it('returns an empty array', function() {
        var features = vectorSource.getFeaturesInExtent(infiniteExtent);
        expect(features).to.be.an(Array);
        expect(features).to.be.empty();
      });

    });

    describe('#isEmpty', function() {

      it('returns true', function() {
        expect(vectorSource.isEmpty()).to.be(true);
      });

    });

    describe('#addFeature', function() {

      it('can add a single point feature', function() {
        vectorSource.addFeature(pointFeature);
        var features = vectorSource.getFeaturesInExtent(infiniteExtent);
        expect(features).to.be.an(Array);
        expect(features).to.have.length(1);
        expect(features[0]).to.be(pointFeature);
      });

      it('fires a change event', function() {
        var listener = sinon.spy();
        goog.events.listen(vectorSource, 'change', listener);
        vectorSource.addFeature(pointFeature);
        expect(listener).to.be.called();
      });

    });

  });

  describe('when populated with 10 random points and a null', function() {

    var features;
    var vectorSource;
    beforeEach(function() {
      features = [];
      var i;
      for (i = 0; i < 10; ++i) {
        features[i] =
            new ol.Feature(new ol.geom.Point([Math.random(), Math.random()]));
      }
      features.push(new ol.Feature(null));
      vectorSource = new ol.source.Vector({
        features: features
      });
    });

    describe('#clear', function() {

      it('removes all features', function() {
        var changeSpy = sinon.spy();
        goog.events.listen(vectorSource, 'change', changeSpy);
        var removeFeatureSpy = sinon.spy();
        goog.events.listen(vectorSource, 'removefeature', removeFeatureSpy);
        vectorSource.clear();
        expect(vectorSource.getFeatures()).to.eql([]);
        expect(vectorSource.isEmpty()).to.be(true);
        expect(changeSpy).to.be.called();
        expect(changeSpy.callCount).to.be(1);
        expect(removeFeatureSpy).to.be.called();
        expect(removeFeatureSpy.callCount).to.be(features.length);
      });

    });

    describe('#forEachFeatureInExtent', function() {

      it('is called the expected number of times', function() {
        var f = sinon.spy();
        vectorSource.forEachFeatureInExtent(infiniteExtent, f);
        expect(f.callCount).to.be(10);
      });

      it('allows breaking out', function() {
        var count = 0;
        var result = vectorSource.forEachFeatureInExtent(infiniteExtent,
            function(f) {
              return ++count == 5;
            });
        expect(result).to.be(true);
        expect(count).to.be(5);
      });

    });

    describe('#getFeaturesInExtent', function() {

      it('returns the expected number of features', function() {
        expect(vectorSource.getFeaturesInExtent(infiniteExtent)).
            to.have.length(10);
      });

    });

    describe('#isEmpty', function() {

      it('returns false', function() {
        expect(vectorSource.isEmpty()).to.be(false);
      });

    });

    describe('#removeFeature', function() {

      it('works as expected', function() {
        var i;
        for (i = features.length - 1; i >= 0; --i) {
          vectorSource.removeFeature(features[i]);
          expect(vectorSource.getFeaturesInExtent(infiniteExtent)).
              have.length(i);
        }
      });

      it('fires a change event', function() {
        var listener = sinon.spy();
        goog.events.listen(vectorSource, 'change', listener);
        vectorSource.removeFeature(features[0]);
        expect(listener).to.be.called();
      });

    });

    describe('modifying a feature\'s geometry', function() {

      it('keeps the R-Tree index up to date', function() {
        expect(vectorSource.getFeaturesInExtent([0, 0, 1, 1])).
            to.have.length(10);
        features[0].getGeometry().setCoordinates([100, 100]);
        expect(vectorSource.getFeaturesInExtent([0, 0, 1, 1])).
            to.have.length(9);
        features[0].getGeometry().setCoordinates([0.5, 0.5]);
        expect(vectorSource.getFeaturesInExtent([0, 0, 1, 1])).
            to.have.length(10);
      });

    });

    describe('setting a features geometry', function() {

      it('keeps the R-Tree index up to date', function() {
        expect(vectorSource.getFeaturesInExtent([0, 0, 1, 1])).
            to.have.length(10);
        features[0].setGeometry(new ol.geom.Point([100, 100]));
        expect(vectorSource.getFeaturesInExtent([0, 0, 1, 1])).
            to.have.length(9);
      });

    });

  });

  describe('tracking changes to features', function() {

    var vectorSource;
    beforeEach(function() {
      vectorSource = new ol.source.Vector();
    });

    it('keeps its index up-to-date', function() {
      var feature = new ol.Feature(new ol.geom.Point([1, 1]));
      vectorSource.addFeature(feature);
      expect(vectorSource.getFeaturesInExtent([0, 0, 2, 2])).
          to.eql([feature]);
      feature.getGeometry().setCoordinates([3, 3]);
      expect(vectorSource.getFeaturesInExtent([0, 0, 2, 2])).
          to.be.empty();
      expect(vectorSource.getFeaturesInExtent([2, 2, 4, 4])).
          to.eql([feature]);
    });

    it('handles features with null geometries', function() {
      var feature = new ol.Feature(null);
      vectorSource.addFeature(feature);
      expect(vectorSource.getFeatures()).to.eql([feature]);
    });

    it('handles features with geometries changing from null', function() {
      var feature = new ol.Feature(null);
      vectorSource.addFeature(feature);
      expect(vectorSource.getFeatures()).to.eql([feature]);
      feature.setGeometry(new ol.geom.Point([1, 1]));
      expect(vectorSource.getFeaturesInExtent([0, 0, 2, 2])).
          to.eql([feature]);
      expect(vectorSource.getFeatures()).to.eql([feature]);
    });

    it('handles features with geometries changing to null', function() {
      var feature = new ol.Feature(new ol.geom.Point([1, 1]));
      vectorSource.addFeature(feature);
      expect(vectorSource.getFeatures()).to.eql([feature]);
      expect(vectorSource.getFeaturesInExtent([0, 0, 2, 2])).
          to.eql([feature]);
      feature.setGeometry(null);
      expect(vectorSource.getFeaturesInExtent([0, 0, 2, 2])).to.be.empty();
      expect(vectorSource.getFeatures()).to.eql([feature]);
    });

    it('fires a change event when setting a feature\'s property', function() {
      var feature = new ol.Feature(new ol.geom.Point([1, 1]));
      vectorSource.addFeature(feature);
      var listener = sinon.spy();
      goog.events.listen(vectorSource, 'change', listener);
      feature.set('foo', 'bar');
      expect(listener).to.be.called();
    });

  });

  describe('#getFeatureById()', function() {
    var source;
    beforeEach(function() {
      source = new ol.source.Vector();
    });

    it('returns a feature by id', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      expect(source.getFeatureById('foo')).to.be(feature);
    });

    it('returns a feature by id (set after add)', function() {
      var feature = new ol.Feature();
      source.addFeature(feature);
      expect(source.getFeatureById('foo')).to.be(null);
      feature.setId('foo');
      expect(source.getFeatureById('foo')).to.be(feature);
    });

    it('returns null when no feature is found', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      expect(source.getFeatureById('bar')).to.be(null);
    });

    it('returns null after removing feature', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      expect(source.getFeatureById('foo')).to.be(feature);
      source.removeFeature(feature);
      expect(source.getFeatureById('foo')).to.be(null);
    });

    it('returns null after unsetting id', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      expect(source.getFeatureById('foo')).to.be(feature);
      feature.setId(undefined);
      expect(source.getFeatureById('foo')).to.be(null);
    });

    it('returns null after clear', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      expect(source.getFeatureById('foo')).to.be(feature);
      source.clear();
      expect(source.getFeatureById('foo')).to.be(null);
    });

    it('returns null when no features are indexed', function() {
      expect(source.getFeatureById('foo')).to.be(null);
      source.addFeature(new ol.Feature());
      expect(source.getFeatureById('foo')).to.be(null);
    });

    it('returns correct feature after add/remove/add', function() {
      expect(source.getFeatureById('foo')).to.be(null);
      var first = new ol.Feature();
      first.setId('foo');
      source.addFeature(first);
      expect(source.getFeatureById('foo')).to.be(first);
      source.removeFeature(first);
      expect(source.getFeatureById('foo')).to.be(null);
      var second = new ol.Feature();
      second.setId('foo');
      source.addFeature(second);
      expect(source.getFeatureById('foo')).to.be(second);
    });

    it('returns correct feature after add/change', function() {
      expect(source.getFeatureById('foo')).to.be(null);
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      expect(source.getFeatureById('foo')).to.be(feature);
      feature.setId('bar');
      expect(source.getFeatureById('foo')).to.be(null);
      expect(source.getFeatureById('bar')).to.be(feature);
    });

  });

  describe('the feature id index', function() {
    var source;
    beforeEach(function() {
      source = new ol.source.Vector();
    });

    it('allows adding feature with the same id', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      var dupe = new ol.Feature();
      dupe.setId('foo');
      source.addFeature(dupe);
      expect(source.getFeatureById('foo')).to.be(dupe);
    });

    it('allows changing feature and set the same id', function() {
      var foo = new ol.Feature();
      foo.setId('foo');
      source.addFeature(foo);
      var bar = new ol.Feature();
      bar.setId('bar');
      source.addFeature(bar);
      bar.setId('foo');
      expect(source.getFeatureById('foo')).to.be(bar);
    });

  });

  describe('the undefined feature id index', function() {
    var source;
    beforeEach(function() {
      source = new ol.source.Vector();
    });

    it('disallows adding the same feature twice', function() {
      var feature = new ol.Feature();
      source.addFeature(feature);
      expect(function() {
        source.addFeature(feature);
      }).to.throwException();
    });
  });

});


goog.require('goog.events');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.source.Vector');
