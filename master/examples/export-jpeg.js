var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});

var exportJPEGElement = document.getElementById('export-jpeg');
exportJPEGElement.addEventListener('click', function(e) {
  e.target.href = map.getRenderer().getCanvas().toDataURL('image/jpeg');
}, false);
