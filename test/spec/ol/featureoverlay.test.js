goog.provide('ol.test.FeatureOverlay');

describe('ol.Feature', function() {
  var featureOverlay;

  beforeEach(function() {
    featureOverlay = new ol.FeatureOverlay();
  });

  afterEach(function() {
    ol.style.IconImageCache.getInstance().clear();
  });

  describe('#drawFeature_ style with no image', function() {
    it('calls vectorContext.drawFeature', function() {
      var vectorContext = new ol.render.canvas.Immediate(
          null,                                 // context
          1,                                    // pixelRatio
          [],                                   // extent
          goog.vec.Mat4.createNumberIdentity(), // transform
          0                                     // viewRotation
          );
      var feature = new ol.Feature();
      var style = new ol.style.Style({
        fill: new ol.style.Fill({
          color: '#ffffff'
        })
      });

      var spy = sinon.spy(vectorContext, 'drawFeature');
      featureOverlay.drawFeature_(vectorContext, feature, style);
      expect(spy.calledOnce).to.be.ok();
    });
  });

  describe('#drawFeature_ style with unloaded image', function() {
    it('calls image.load', function() {
      var vectorContext = new ol.render.canvas.Immediate(
          null,                                 // context
          1,                                    // pixelRatio
          [],                                   // extent
          goog.vec.Mat4.createNumberIdentity(), // transform
          0                                     // viewRotation
          );
      var feature = new ol.Feature();
      var style = new ol.style.Style({
        image: new ol.style.Icon({
          src: 'http://example.com/icon.png'
        })
      });

      var stub = sinon.stub(style.getImage(), 'load', function() {
        style.getImage().iconImage_.imageState_ =
            ol.style.ImageState.LOADING;
      });
      featureOverlay.drawFeature_(vectorContext, feature, style);
      expect(stub.calledOnce).to.be.ok();
    });
  });
});

goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.style.ImageState');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.IconImageCache');
goog.require('ol.style.Style');
