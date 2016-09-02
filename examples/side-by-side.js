goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.has');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map1 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: 'dom',
  target: 'domMap',
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  })
});

var map2 = new ol.Map({
  target: 'canvasMap',
  layers: map1.getLayers(),
  view: map1.getView()
});

if (ol.has.WEBGL) {
  var map3 = new ol.Map({
    renderer: 'webgl',
    target: 'webglMap',
    layers: map1.getLayers(),
    view: map1.getView()
  });
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}
