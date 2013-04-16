goog.require('ol.DeviceOrientation');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
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
var track = new ol.dom.Input(document.getElementById('track'));
track.bindTo('checked', deviceOrientation, 'tracking');

deviceOrientation.on('changed', function() {
  document.getElementById('alpha').innerHTML = deviceOrientation.getAlpha();
  document.getElementById('beta').innerHTML = deviceOrientation.getBeta();
  document.getElementById('gamma').innerHTML = deviceOrientation.getGamma();
  document.getElementById('heading').innerHTML = deviceOrientation.getHeading();
});
