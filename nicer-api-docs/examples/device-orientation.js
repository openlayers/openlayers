var view = new ol.View2D({
  center: [0, 0],
  zoom: 2
});
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: view
});

var deviceOrientation = new ol.DeviceOrientation();
var track = new ol.dom.Input(document.getElementById('track'));
track.bindTo('checked', deviceOrientation, 'tracking');

deviceOrientation.on('change', function(event) {
  $('#alpha').text(deviceOrientation.getAlpha() + ' [rad]');
  $('#beta').text(deviceOrientation.getBeta() + ' [rad]');
  $('#gamma').text(deviceOrientation.getGamma() + ' [rad]');
  $('#heading').text(deviceOrientation.getHeading() + ' [rad]');
});

// tilt the map
deviceOrientation.on(['change:beta', 'change:gamma'], function(event) {
  var center = view.getCenter();
  var resolution = view.getResolution();
  var beta = event.target.getBeta() || 0;
  var gamma = event.target.getGamma() || 0;

  center[0] -= resolution * gamma * 25;
  center[1] += resolution * beta * 25;

  view.setCenter(center);
});
