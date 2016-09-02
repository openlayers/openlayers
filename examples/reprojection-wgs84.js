goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});
