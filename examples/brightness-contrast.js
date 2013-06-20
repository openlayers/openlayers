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
var resetBrightness = document.getElementById('reset-brightness');
var decreaseBrightness = document.getElementById('decrease-brightness');

function setResetBrightnessButtonHTML() {
  resetBrightness.innerHTML = 'Brightness (' + layer.getBrightness() + ')';
}
setResetBrightnessButtonHTML();

increaseBrightness.addEventListener('click', function() {
  layer.setBrightness(Math.min(layer.getBrightness() + 0.125, 1));
  setResetBrightnessButtonHTML();
}, false);
resetBrightness.addEventListener('click', function() {
  layer.setBrightness(0);
  setResetBrightnessButtonHTML();
}, false);
decreaseBrightness.addEventListener('click', function() {
  layer.setBrightness(Math.max(layer.getBrightness() - 0.125, -1));
  setResetBrightnessButtonHTML();
}, false);

var increaseContrast = document.getElementById('increase-contrast');
var resetContrast = document.getElementById('reset-contrast');
var decreaseContrast = document.getElementById('decrease-contrast');

function setResetContrastButtonHTML() {
  resetContrast.innerHTML = 'Contrast (' + layer.getContrast() + ')';
}
setResetContrastButtonHTML();

increaseContrast.addEventListener('click', function() {
  layer.setContrast(layer.getContrast() + 0.125);
  setResetContrastButtonHTML();
}, false);
resetContrast.addEventListener('click', function() {
  layer.setContrast(1);
  setResetContrastButtonHTML();
}, false);
decreaseContrast.addEventListener('click', function() {
  layer.setContrast(Math.max(layer.getContrast() - 0.125, 0));
  setResetContrastButtonHTML();
}, false);
