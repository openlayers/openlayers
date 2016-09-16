goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.has');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

var layer = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var view = new ol.View({
  center: [0, 0],
  zoom: 1
});

var map1 = new ol.Map({
  target: 'canvasMap',
  layers: [layer],
  view: view
});

if (ol.has.WEBGL) {
  var map2 = new ol.Map({
    target: 'webglMap',
    renderer: /** @type {ol.renderer.Type} */ ('webgl'),
    layers: [layer],
    view: view
  });
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}
