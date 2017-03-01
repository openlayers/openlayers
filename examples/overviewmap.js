goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.OverviewMap');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.OverviewMap()
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [500000, 6000000],
    zoom: 7
  })
});
