goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.interaction');
goog.require('ol.interaction.MouseWheelZoom');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  interactions: ol.interaction.defaults({mouseWheelZoom: false}).extend([
    new ol.interaction.MouseWheelZoom({
      constrainResolution: true // force zooming to a integer zoom
    })
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
