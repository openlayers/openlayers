goog.require('ol.DeviceOrientation');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');

var projection = ol.proj.get('EPSG:3857');
var view = new ol.View({
  center: [0, 0],
  projection: projection,
  extent: projection.getExtent(),
  zoom: 2
});
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: view
});

var deviceOrientation = new ol.DeviceOrientation();

function el(id) {
  return document.getElementById(id);
}

el('track').addEventListener('change', function() {
  deviceOrientation.setTracking(this.checked);
});

deviceOrientation.on('change', function() {
  el('alpha').innerText = deviceOrientation.getAlpha() + ' [rad]';
  el('beta').innerText = deviceOrientation.getBeta() + ' [rad]';
  el('gamma').innerText = deviceOrientation.getGamma() + ' [rad]';
  el('heading').innerText = deviceOrientation.getHeading() + ' [rad]';
});

// tilt the map
deviceOrientation.on(['change:beta', 'change:gamma'], function(event) {
  var center = view.getCenter();
  var resolution = view.getResolution();
  var beta = event.target.getBeta() || 0;
  var gamma = event.target.getGamma() || 0;

  center[0] -= resolution * gamma * 25;
  center[1] += resolution * beta * 25;

  view.setCenter(view.constrainCenter(center));
});
