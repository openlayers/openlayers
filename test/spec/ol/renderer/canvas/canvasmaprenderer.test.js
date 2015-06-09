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
      map.on('postcompose', function() {});
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

    it('uses correct extent and offset on wrapped worlds', function() {
      var spy = sinon.spy(renderer, 'getTransform');
      var proj = new ol.proj.Projection({
        code: 'foo',
        extent: [-180, -90, 180, 90],
        global: true
      });
      var frameState = {
        coordinateToPixelMatrix: map.coordinateToPixelMatrix_,
        pixelToCoordinateMatrix: map.pixelToCoordinateMatrix_,
        pixelRatio: 1,
        size: [100, 100],
        skippedFeatureUids: {},
        extent: proj.getExtent(),
        viewState: {
          center: [0, 0],
          projection: proj,
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
      frameState.focus = [0, 0];
      // focus is on real world
      renderer.renderFrame(frameState);
      expect(spy.getCall(0).args[1]).to.be(0);
      expect(renderer.replayGroup.maxExtent_).to.eql([-180, -90, 180, 90]);
      frameState.focus = [-200, 0];
      // focus is one world left of the real world
      renderer.renderFrame(frameState);
      expect(spy.getCall(1).args[1]).to.be(360);
      expect(renderer.replayGroup.maxExtent_).to.eql([180, -90, 540, 90]);
      frameState.focus = [200, 0];
      // focus is one world right of the real world
      renderer.renderFrame(frameState);
      expect(spy.getCall(2).args[1]).to.be(-360);
      expect(renderer.replayGroup.maxExtent_).to.eql([-540, -90, -180, 90]);
    });
  });

});


goog.require('ol.layer.Vector');
goog.require('ol.Map');
goog.require('ol.proj.Projection');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.source.Vector');
