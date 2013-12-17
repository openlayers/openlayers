goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.webgl');

goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View2D');


var domMap = new ga.Map({
  target: "domMap",
  layers: [
    ga.layer.create('ch.swisstopo.pixelkarte-farbe')
  ],
  renderer: ol.RendererHint.DOM,
  view: new ol.View2D({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 10,
    // Define a coordinate CH1903 for the center of the view
    center: [561666.5, 185569.5]
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
