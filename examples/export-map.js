goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var exportJPEGElement = document.getElementById('export-jpeg');
exportJPEGElement.addEventListener('click', function(e) {
  e.target.href = map.getRenderer().getCanvas().toDataURL('image/jpeg');
}, false);

var exportPNGElement = document.getElementById('export-png');
exportPNGElement.addEventListener('click', function(e) {
  e.target.href = map.getRenderer().getCanvas().toDataURL('image/png');
}, false);
