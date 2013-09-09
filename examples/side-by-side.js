goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.webgl.SUPPORTED');


var domMap = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderer: ol.RendererHint.DOM,
  target: 'domMap',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

if (ol.webgl.SUPPORTED) {
  var webglMap = new ol.Map({
    renderer: ol.RendererHint.WEBGL,
    target: 'webglMap'
  });
  webglMap.bindTo('layergroup', domMap);
  webglMap.bindTo('view', domMap);
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}

var canvasMap = new ol.Map({
  renderer: ol.RendererHint.CANVAS,
  target: 'canvasMap'
});
canvasMap.bindTo('layergroup', domMap);
canvasMap.bindTo('view', domMap);
