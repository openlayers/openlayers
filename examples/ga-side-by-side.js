goog.require('ga.Map');
goog.require('ga.layer');
goog.require('ol.View');
goog.require('ol.has');


var canvasMap = new ga.Map({
  target: 'canvasMap',
  layers: [
    ga.layer.create('ch.swisstopo.pixelkarte-farbe')
  ],
  renderer: 'canvas',
  view: new ol.View({
    // Define the default resolution
    // 10 means that one pixel is 10m width and height
    // List of resolution of the WMTS layers:
    // 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1, 0.5, 0.25, 0.1
    resolution: 10,
    // Define a coordinate CH1903 for the center of the view
    center: [561666.5, 185569.5]
  })
});

if (ol.has.WEBGL) {
  var webglMap = new ga.Map({
    renderer: 'webgl',
    target: 'webglMap',
    layers: canvasMap.getLayers(),
    view: canvasMap.getView()
  });
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}
