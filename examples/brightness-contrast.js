goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.has');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');


function setResetBrightnessButtonHTML() {
  resetBrightness.innerHTML = 'Brightness (' +
      layer.getBrightness().toFixed(3) + ')';
}

function setResetContrastButtonHTML() {
  resetContrast.innerHTML = 'Contrast (' + layer.getContrast().toFixed(3) + ')';
}

if (!ol.has.WEBGL) {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
} else {
  var layer = new ol.layer.Tile({
    source: new ol.source.MapQuest({layer: 'sat'})
  });

  var map = new ol.Map({
    layers: [layer],
    renderer: 'webgl',
    target: 'map',
    view: new ol.View({
      center: [0, 0],
      zoom: 2
    })
  });

  var increaseBrightness = document.getElementById('increase-brightness');
  var resetBrightness = document.getElementById('reset-brightness');
  var decreaseBrightness = document.getElementById('decrease-brightness');

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
}
