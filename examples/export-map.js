goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OpenStreetMap');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  // ol.View2DOptions typecast required only when example
  // code is compiled with Closure Compiler
  view: /** @type {ol.View2DOptions} */ ({
    center: new ol.Coordinate(0, 0),
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
