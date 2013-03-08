goog.require('ol.Coordinate');
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
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});

var increaseHue = document.getElementById('increase-hue');
increaseHue.addEventListener('click', function() {
  layer.setHue(layer.getHue() + 0.25);
}, false);
var resetHue = document.getElementById('reset-hue');
resetHue.addEventListener('click', function() {
  layer.setHue(0);
}, false);
var decreaseHue = document.getElementById('decrease-hue');
decreaseHue.addEventListener('click', function() {
  layer.setHue(layer.getHue() - 0.25);
}, false);

var increaseSaturation = document.getElementById('increase-saturation');
increaseSaturation.addEventListener('click', function() {
  layer.setSaturation(layer.getSaturation() + 0.25);
}, false);
var resetSaturation = document.getElementById('reset-saturation');
resetSaturation.addEventListener('click', function() {
  layer.setSaturation(1);
}, false);
var decreaseSaturation = document.getElementById('decrease-saturation');
decreaseSaturation.addEventListener('click', function() {
  layer.setSaturation(layer.getSaturation() - 0.25);
}, false);
