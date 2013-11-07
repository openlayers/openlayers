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

    describe('#getAllFeaturesInExtent', function() {

      it('returns an empty array', function() {
        var features = vectorSource.getAllFeaturesInExtent(infiniteExtent);
        expect(features).to.be.an(Array);
        expect(features).to.be.empty();
      });

    });

    describe('#addFeature', function() {

      it('can add a single point feature', function() {
        vectorSource.addFeature(pointFeature);
        var features = vectorSource.getAllFeaturesInExtent(infiniteExtent);
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

  describe('when populated with 10 random points', function() {

    var features;
    var vectorSource;
    beforeEach(function() {
      features = [];
      var i;
      for (i = 0; i < 10; ++i) {
        features[i] =
            new ol.Feature(new ol.geom.Point([Math.random(), Math.random()]));
      }
      vectorSource = new ol.source.Vector({
        features: features
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

    describe('#getAllFeaturesInExtent', function() {

      it('returns the expected number of features', function() {
        expect(vectorSource.getAllFeaturesInExtent(infiniteExtent)).
            to.have.length(10);
      });

    });

    describe('#removeFeature', function() {

      it('works as expected', function() {
        var i;
        for (i = features.length - 1; i >= 0; --i) {
          vectorSource.removeFeature(features[i]);
          expect(vectorSource.getAllFeaturesInExtent(infiniteExtent)).
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

      it('fires a change event', function() {
        var listener = sinon.spy();
        goog.events.listen(vectorSource, 'change', listener);
        features[0].getGeometry().setCoordinate([100, 100]);
        expect(listener).to.be.called();
      });

      if (false) {
        it('keeps the R-Tree index up to date', function() {
          expect(vectorSource.getAllFeaturesInExtent([0, 0, 1, 1])).
              to.have.length(10);
          features[0].getGeometry().setCoordinate([100, 100]);
          expect(vectorSource.getAllFeaturesInExtent([0, 0, 1, 1])).
              to.have.length(9);
          features[0].getGeometry().setCoordinate([0.5, 0.5]);
          expect(vectorSource.getAllFeaturesInExtent([0, 0, 1, 1])).
              to.have.length(10);
        });
      }

    });

    describe('setting a features geometry', function() {

      it('fires a change event', function() {
        var listener = sinon.spy();
        goog.events.listen(vectorSource, 'change', listener);
        features[0].setGeometry(new ol.geom.Point([100, 100]));
        expect(listener).to.be.called();
      });

      if (false) {
        it('keeps the R-Tree index up to date', function() {
          expect(vectorSource.getAllFeaturesInExtent([0, 0, 1, 1])).
              to.have.length(10);
          features[0].setGeometry(new ol.geom.Point([100, 100]));
          expect(vectorSource.getAllFeaturesInExtent([0, 0, 1, 1])).
              to.have.length(9);
        });
      }
    });

  });

});


goog.require('goog.events');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.source.Vector');
