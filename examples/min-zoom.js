goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

var viewport = document.getElementById('map');

function getMinZoom() {
  var width = viewport.clientWidth;
  return Math.ceil(Math.LOG2E * Math.log(width / 256));
}

var initialZoom = getMinZoom();

var view = new ol.View({
  center: [0, 0],
  minZoom: initialZoom,
  zoom: initialZoom
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: view
});

window.addEventListener('resize', function() {
  var minZoom = getMinZoom();
  if (minZoom !== view.getMinZoom()) {
    view.setMinZoom(minZoom);
  }
});
