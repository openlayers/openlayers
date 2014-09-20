goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.has');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');

var domView = new ol.View({
  center: [0, 0],
  zoom: 1
});

var layer = new ol.layer.Tile({
  source: new ol.source.MapQuest({layer: 'sat'})
});

var domMap = new ol.Map({
  target: 'domMap',
  renderer: 'dom',
  layers: [layer],
  view: domView
});

if (ol.has.WEBGL) {
  var webGlView = new ol.View();
  webGlView.bindTo('center', domView);
  webGlView.bindTo('resolution', domView);
  webGlView.bindTo('rotation', domView);
  var webglMap = new ol.Map({
    target: 'webglMap',
    renderer: 'webgl',
    layers: [layer],
    view: webGlView
  });
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}

var canvasView = new ol.View();
canvasView.bindTo('center', domView);
canvasView.bindTo('resolution', domView);
canvasView.bindTo('rotation', domView);
var canvasMap = new ol.Map({
  target: 'canvasMap',
  layers: [layer],
  view: canvasView
});
