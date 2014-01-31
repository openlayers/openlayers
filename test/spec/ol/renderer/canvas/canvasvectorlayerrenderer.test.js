goog.provide('ol.test.renderer.canvas.VectorLayer');

describe('ol.renderer.canvas.VectorLayer', function() {
  var renderer;

  beforeEach(function() {
    ol.proj.common.add();

    var map = new ol.Map({
    });
    var layer = new ol.layer.Vector({
      source: new ol.source.Vector({})
    });
    renderer = new ol.renderer.canvas.VectorLayer(
        map.renderer_, layer);
  });

  describe('#renderFeature', function() {
    it('registers one listener for an icon style', function() {
      var feature = new ol.Feature();
      var imageStyle = new ol.style.Icon({});
      var style = new ol.style.Style({
        image: imageStyle
      });
      var styleFunction = function(feature, resolution) {
        return [style];
      };
      var replayGroup = new ol.render.canvas.ReplayGroup(1);

      var listeners;
      listeners = goog.events.getListeners(
          imageStyle, goog.events.EventType.CHANGE, false);
      expect(listeners.length).to.eql(0);

      imageStyle.imageState = ol.style.ImageState.LOADING;
      renderer.renderFeature(feature, 1, 1, styleFunction,
          replayGroup);

      listeners = goog.events.getListeners(
          imageStyle, goog.events.EventType.CHANGE, false);
      expect(listeners.length).to.eql(1);

      imageStyle.imageState = ol.style.ImageState.LOADING;
      renderer.renderFeature(feature, 1, 1, styleFunction,
          replayGroup);

      listeners = goog.events.getListeners(
          imageStyle, goog.events.EventType.CHANGE, false);
      expect(listeners.length).to.eql(1);
    });
  });
});

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.layer.Vector');
goog.require('ol.proj.common');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.VectorLayer');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.ImageState');
goog.require('ol.style.Style');
