goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.interaction');
goog.require('ol.interaction.DragRotateAndZoom');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');


var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([
    new ol.interaction.DragRotateAndZoom()
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
