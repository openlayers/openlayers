goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
goog.require('ol.source.BingMaps');


var layer = new ol.layer.TileLayer({
  source: new ol.source.BingMaps({
    key: 'AlQLZ0-5yk301_ESrmNLma3LYxEKNSg7w-e_knuRfyYFtld-UFvXVs38NOulku3Q',
    style: 'Aerial'
  })
});

var map = new ol.Map({
  layers: [layer],
  renderer: ol.RendererHint.WEBGL,
  target: 'map',
  view: new ol.View2D({
    center: ol.proj.transform([-9.375, 51.483333], 'EPSG:4326', 'EPSG:3857'),
    zoom: 15
  })
});

var increaseHue = document.getElementById('increase-hue');
var resetHue = document.getElementById('reset-hue');
var decreaseHue = document.getElementById('decrease-hue');

function setResetHueButtonHTML() {
  resetHue.innerHTML = 'Hue (' + layer.getHue() + ')';
}
setResetHueButtonHTML();

increaseHue.addEventListener('click', function() {
  layer.setHue(layer.getHue() + 0.25);
  setResetHueButtonHTML();
}, false);
resetHue.addEventListener('click', function() {
  layer.setHue(0);
  setResetHueButtonHTML();
}, false);
decreaseHue.addEventListener('click', function() {
  layer.setHue(layer.getHue() - 0.25);
  setResetHueButtonHTML();
}, false);

var increaseSaturation = document.getElementById('increase-saturation');
var resetSaturation = document.getElementById('reset-saturation');
var decreaseSaturation = document.getElementById('decrease-saturation');

function setResetSaturationButtonHTML() {
  resetSaturation.innerHTML = 'Saturation (' + layer.getSaturation() + ')';
}
setResetSaturationButtonHTML();

increaseSaturation.addEventListener('click', function() {
  layer.setSaturation(layer.getSaturation() + 0.25);
  setResetSaturationButtonHTML();
}, false);
resetSaturation.addEventListener('click', function() {
  layer.setSaturation(1);
  setResetSaturationButtonHTML();
}, false);
decreaseSaturation.addEventListener('click', function() {
  layer.setSaturation(layer.getSaturation() - 0.25);
  setResetSaturationButtonHTML();
}, false);
