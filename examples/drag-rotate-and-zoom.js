goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.interaction.DragRotateAndZoom');
goog.require('ol.interaction.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


var map = new ol.Map({
  interactions: ol.interaction.defaults({}, [
    new ol.interaction.DragRotateAndZoom()
  ]),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
