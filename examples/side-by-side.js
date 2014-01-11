goog.require('ol.BrowserFeature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuest');


var domMap = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    })
  ],
  renderer: ol.RendererHint.DOM,
  target: 'domMap',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});

if (!ol.BrowserFeature.HAS_WEBGL) {
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
