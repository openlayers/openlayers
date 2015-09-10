var domMap = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'sat'})
    })
  ],
  renderer: 'dom',
  target: 'domMap',
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  })
});

if (ol.has.WEBGL) {
  var webglMap = new ol.Map({
    renderer: 'webgl',
    target: 'webglMap',
    layers: domMap.getLayers(),
    view: domMap.getView()
  });
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}

var canvasMap = new ol.Map({
  target: 'canvasMap',
  layers: domMap.getLayers(),
  view: domMap.getView()
});
