// NOCOMPILE
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.math');
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
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: view
});

function el(id) {
  return document.getElementById(id);
}


var gn = new GyroNorm();

gn.init().then(function() {
  gn.start(function(event) {
    var center = view.getCenter();
    var resolution = view.getResolution();
    var alpha = ol.math.toRadians(event.do.beta);
    var beta = ol.math.toRadians(event.do.beta);
    var gamma = ol.math.toRadians(event.do.gamma);

    el('alpha').innerText = alpha + ' [rad]';
    el('beta').innerText = beta + ' [rad]';
    el('gamma').innerText = gamma + ' [rad]';

    center[0] -= resolution * gamma * 25;
    center[1] += resolution * beta * 25;

    view.setCenter(view.constrainCenter(center));
  });
});
