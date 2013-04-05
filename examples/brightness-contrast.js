goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var map = new ol.Map({
  layers: [layer],
  renderer: ol.RendererHint.WEBGL,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

var increaseBrightness = document.getElementById('increase-brightness');
increaseBrightness.addEventListener('click', function() {
  layer.setBrightness(layer.getBrightness() + 0.125);
}, false);
var resetBrightness = document.getElementById('reset-brightness');
resetBrightness.addEventListener('click', function() {
  layer.setBrightness(0);
}, false);
var decreaseBrightness = document.getElementById('decrease-brightness');
decreaseBrightness.addEventListener('click', function() {
  layer.setBrightness(layer.getBrightness() - 0.125);
}, false);

var increaseContrast = document.getElementById('increase-contrast');
increaseContrast.addEventListener('click', function() {
  layer.setContrast(layer.getContrast() + 0.125);
}, false);
var resetContrast = document.getElementById('reset-contrast');
resetContrast.addEventListener('click', function() {
  layer.setContrast(1);
}, false);
var decreaseContrast = document.getElementById('decrease-contrast');
decreaseContrast.addEventListener('click', function() {
  layer.setContrast(layer.getContrast() - 0.125);
}, false);
