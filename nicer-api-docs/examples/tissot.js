var vectorSource = new ol.source.Vector();

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileWMS({
        url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
        params: {
          'VERSION': '1.1.1',
          'LAYERS': 'basic',
          'FORMAT': 'image/jpeg'
        }
      })
    }),
    new ol.layer.Vector({
      source: vectorSource
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});


var radius = 800000;
for (var x = -180; x < 180; x += 30) {
  for (var y = -90; y < 90; y += 30) {
    var geometry = ol.sphere.WGS84.circle([x, y], radius, 64);
    vectorSource.addFeature(new ol.Feature(geometry));
  }
}
