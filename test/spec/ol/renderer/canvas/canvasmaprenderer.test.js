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

  });

});


goog.require('ol.layer.Vector');
goog.require('ol.Map');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.Map');
goog.require('ol.source.Vector');
