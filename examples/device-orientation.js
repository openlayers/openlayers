goog.require('ol.DeviceOrientation');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');

var view = new ol.View2D({
  center: [0, 0],
  zoom: 2
});
var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: view
});

var deviceOrientation = new ol.DeviceOrientation();

deviceOrientation.on('changed', function() {
  document.getElementById('alpha').innerHTML = deviceOrientation.getAlpha();
  document.getElementById('beta').innerHTML = deviceOrientation.getBeta();
  document.getElementById('gamma').innerHTML = deviceOrientation.getGamma();
});
