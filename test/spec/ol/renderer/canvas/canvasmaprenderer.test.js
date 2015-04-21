goog.provide('ol.test.renderer.canvas.Map');

describe('ol.renderer.canvas.Map', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var map = new ol.Map({
        target: document.createElement('div')
      });
      var renderer = new ol.renderer.canvas.Map(map.viewport_, map);
      expect(renderer).to.be.a(ol.renderer.canvas.Map);
    });

  });

  describe('#renderFrame()', function() {
    var layer, map, renderer;

    beforeEach(function() {
      map = new ol.Map({});
      layer = new ol.layer.Vector({
        source: new ol.source.Vector({wrapX: true})
      });
      renderer = map.getRenderer();
      renderer.layerRenderers_ = {};
      var layerRenderer = new ol.renderer.canvas.Layer(layer);
      layerRenderer.prepareFrame = function() { return true; };
      layerRenderer.getImage = function() { return null; };
      renderer.layerRenderers_[goog.getUid(layer)] = layerRenderer;
    });

    it('calls #dispatchComposeEvent_() with a wrapX argument', function() {
      var spy = sinon.spy(renderer, 'dispatchComposeEvent_');
      var frameState = {
        coordinateToPixelMatrix: map.coordinateToPixelMatrix_,
        pixelToCoordinateMatrix: map.pixelToCoordinateMatrix_,
        pixelRatio: 1,
        size: [100, 100],
        skippedFeatureUids: {},
        viewState: {
          center: [0, 0],
          resolution: 1,
          rotation: 0
        },
        layerStates: {},
        layerStatesArray: [{
          layer: layer,
          sourceState: 'ready',
          visible: true,
          minResolution: 1,
          maxResolution: 2
        }],
        postRenderFunctions: []
      };
      renderer.renderFrame(frameState);
      // precompose without wrapX
      expect(spy.getCall(0).args[2]).to.be(false);
      // postcompose with wrapX
      expect(spy.getCall(1).args[2]).to.be(true);
    });
  });

});


goog.require('ol.layer.Vector');
goog.require('ol.Map');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.source.Vector');
