goog.provide('ol.test.source.Vector');

goog.require('ol.events');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');
goog.require('ol.proj');
goog.require('ol.source.Vector');


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
        ol.events.listen(vectorSource, 'change', listener);
        vectorSource.addFeature(pointFeature);
        expect(listener).to.be.called();
      });

      it('adds same id features only once', function() {
        var source = new ol.source.Vector();
        var feature1 = new ol.Feature();
        feature1.setId('1');
        var feature2 = new ol.Feature();
        feature2.setId('1');
        source.addFeature(feature1);
        source.addFeature(feature2);
        expect(source.getFeatures().length).to.be(1);
      });

    });

  });

  describe('when populated with 3 features', function() {

    var features = [];
    var vectorSource;
    beforeEach(function() {
      features.push(new ol.Feature(new ol.geom.LineString([[0, 0], [10, 10]])));
      features.push(new ol.Feature(new ol.geom.Point([0, 10])));
      features.push(new ol.Feature(new ol.geom.Point([10, 5])));
      vectorSource = new ol.source.Vector({
        features: features
      });
    });

    describe('#getClosestFeatureToCoordinate', function() {

      it('returns the expected feature', function() {
        var feature = vectorSource.getClosestFeatureToCoordinate([1, 9]);
        expect(feature).to.be(features[1]);
      });

      it('returns the expected feature when a filter is used', function() {
        var feature = vectorSource.getClosestFeatureToCoordinate([1, 9], function(feature) {
          return feature.getGeometry().getType() == 'LineString';
        });
        expect(feature).to.be(features[0]);
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

      it('removes all features using fast path', function() {
        var changeSpy = sinon.spy();
        ol.events.listen(vectorSource, 'change', changeSpy);
        var removeFeatureSpy = sinon.spy();
        ol.events.listen(vectorSource, 'removefeature', removeFeatureSpy);
        var clearSourceSpy = sinon.spy();
        ol.events.listen(vectorSource, 'clear', clearSourceSpy);
        vectorSource.clear(true);
        expect(vectorSource.getFeatures()).to.eql([]);
        expect(vectorSource.isEmpty()).to.be(true);
        expect(changeSpy).to.be.called();
        expect(changeSpy.callCount).to.be(1);
        expect(removeFeatureSpy).not.to.be.called();
        expect(removeFeatureSpy.callCount).to.be(0);
        expect(clearSourceSpy).to.be.called();
        expect(clearSourceSpy.callCount).to.be(1);
      });

      it('removes all features using slow path', function() {
        var changeSpy = sinon.spy();
        ol.events.listen(vectorSource, 'change', changeSpy);
        var removeFeatureSpy = sinon.spy();
        ol.events.listen(vectorSource, 'removefeature', removeFeatureSpy);
        var clearSourceSpy = sinon.spy();
        ol.events.listen(vectorSource, 'clear', clearSourceSpy);
        vectorSource.clear();
        expect(vectorSource.getFeatures()).to.eql([]);
        expect(vectorSource.isEmpty()).to.be(true);
        expect(changeSpy).to.be.called();
        expect(changeSpy.callCount).to.be(1);
        expect(removeFeatureSpy).to.be.called();
        expect(removeFeatureSpy.callCount).to.be(features.length);
        expect(clearSourceSpy).to.be.called();
        expect(clearSourceSpy.callCount).to.be(1);
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
        ol.events.listen(vectorSource, 'change', listener);
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
      ol.events.listen(vectorSource, 'change', listener);
      feature.set('foo', 'bar');
      expect(listener).to.be.called();
    });

    it('fires a changefeature event when updating a feature', function() {
      var feature = new ol.Feature(new ol.geom.Point([1, 1]));
      vectorSource.addFeature(feature);
      var listener = sinon.spy(function(event) {
        expect(event.feature).to.be(feature);
      });
      vectorSource.on('changefeature', listener);
      feature.setStyle(null);
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

  describe('#loadFeatures', function() {

    describe('with no loader and the "all" strategy', function() {

      it('stores the infinity extent in the Rtree', function() {
        var source = new ol.source.Vector();
        source.loadFeatures([-10000, -10000, 10000, 10000], 1,
            ol.proj.get('EPSG:3857'));
        var loadedExtents = source.loadedExtentsRtree_.getAll();
        expect(loadedExtents).to.have.length(1);
        expect(loadedExtents[0].extent).to.eql(
            [-Infinity, -Infinity, Infinity, Infinity]);
      });
    });

  });

  describe('the feature id index', function() {
    var source;
    beforeEach(function() {
      source = new ol.source.Vector();
    });

    it('ignores features with the same id', function() {
      var feature = new ol.Feature();
      feature.setId('foo');
      source.addFeature(feature);
      var dupe = new ol.Feature();
      dupe.setId('foo');
      source.addFeature(dupe);
      expect(source.getFeatures()).to.have.length(1);
      expect(source.getFeatureById('foo')).to.be(feature);
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

  describe('with useSpatialIndex set to false', function() {
    var source;
    beforeEach(function() {
      source = new ol.source.Vector({useSpatialIndex: false});
    });

    it('returns a features collection', function() {
      expect(source.getFeaturesCollection()).to.be.a(ol.Collection);
    });

    it('#forEachFeatureInExtent loops through all features', function() {
      source.addFeatures([new ol.Feature(), new ol.Feature()]);
      var spy = sinon.spy();
      source.forEachFeatureInExtent([0, 0, 0, 0], spy);
      expect(spy.callCount).to.be(2);
    });

  });

  describe('with a collection of features', function() {
    var collection, source;
    beforeEach(function() {
      source = new ol.source.Vector({
        useSpatialIndex: false
      });
      collection = source.getFeaturesCollection();
    });

    it('creates a features collection', function() {
      expect(source.getFeaturesCollection()).to.not.be(null);
    });

    it('adding/removing features keeps the collection in sync', function() {
      var feature = new ol.Feature();
      source.addFeature(feature);
      expect(collection.getLength()).to.be(1);
      source.removeFeature(feature);
      expect(collection.getLength()).to.be(0);
    });

    it('#clear() features keeps the collection in sync', function() {
      var feature = new ol.Feature();
      source.addFeatures([feature]);
      expect(collection.getLength()).to.be(1);
      source.clear();
      expect(collection.getLength()).to.be(0);
      source.addFeatures([feature]);
      expect(collection.getLength()).to.be(1);
      source.clear(true);
      expect(collection.getLength()).to.be(0);
    });

    it('keeps the source\'s features in sync with the collection', function() {
      var feature = new ol.Feature();
      collection.push(feature);
      expect(source.getFeatures().length).to.be(1);
      collection.remove(feature);
      expect(source.getFeatures().length).to.be(0);
      collection.extend([feature]);
      expect(source.getFeatures().length).to.be(1);
      collection.clear();
      expect(source.getFeatures().length).to.be(0);
    });

  });

  describe('with a collection of features plus spatial index', function() {
    var collection, source;
    beforeEach(function() {
      collection = new ol.Collection();
      source = new ol.source.Vector({
        features: collection
      });
    });

    it('#getFeaturesCollection returns the configured collection', function() {
      expect(source.getFeaturesCollection()).to.equal(collection);
    });

    it('adding/removing features keeps the collection in sync', function() {
      var feature = new ol.Feature();
      source.addFeature(feature);
      expect(collection.getLength()).to.be(1);
      source.removeFeature(feature);
      expect(collection.getLength()).to.be(0);
    });

    it('#clear() features keeps the collection in sync', function() {
      var feature = new ol.Feature();
      source.addFeatures([feature]);
      expect(collection.getLength()).to.be(1);
      source.clear();
      expect(collection.getLength()).to.be(0);
      source.addFeatures([feature]);
      expect(collection.getLength()).to.be(1);
      source.clear(true);
      expect(collection.getLength()).to.be(0);
    });

    it('keeps the source\'s features in sync with the collection', function() {
      var feature = new ol.Feature();
      collection.push(feature);
      expect(source.getFeatures().length).to.be(1);
      collection.remove(feature);
      expect(source.getFeatures().length).to.be(0);
      collection.extend([feature]);
      expect(source.getFeatures().length).to.be(1);
      collection.clear();
      expect(source.getFeatures().length).to.be(0);
    });

  });

});
