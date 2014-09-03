goog.provide('ol.test.FeatureOverlay');

describe('ol.FeatureOverlay', function() {

  describe('constructor', function() {

    it('creates an new feature overlay', function() {
      var featureOverlay = new ol.FeatureOverlay();
      expect(featureOverlay).to.be.a(ol.FeatureOverlay);
    });

    it('takes features', function() {
      var featureOverlay = new ol.FeatureOverlay({
        features: [new ol.Feature(new ol.geom.Point([0, 0]))]
      });
      expect(featureOverlay.getFeatures().getLength()).to.be(1);
    });

    it('takes a style and makes it immutable', function() {
      var style = [new ol.style.Style()];
      var featureOverlay = new ol.FeatureOverlay({
        style: [new ol.style.Style()]
      });
      style[0].setMutable(false);
      expect(featureOverlay.getStyle()).to.eql(style);
      expect(featureOverlay.getStyleFunction()()).to.eql(style);
    });

  });
});

goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.geom.Point');
goog.require('ol.style.Style');
