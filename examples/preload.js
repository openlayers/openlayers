goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.BingMaps');


var map1 = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      preload: Infinity,
      source: new ol.source.BingMaps({
        key: 'AlQLZ0-5yk301_ESrmNLma3LYxEKNSg7w-e_knuRfyYFtld-UFvXVs38NOulku3Q',
        style: 'Aerial'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map1',
  view: new ol.View2D({
    center: [-4808600, -2620936],
    zoom: 8
  })
});

var map2 = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      preload: 0, // default value
      source: new ol.source.BingMaps({
        key: 'AlQLZ0-5yk301_ESrmNLma3LYxEKNSg7w-e_knuRfyYFtld-UFvXVs38NOulku3Q',
        style: 'AerialWithLabels'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map2'
});
map2.bindTo('view', map1);
