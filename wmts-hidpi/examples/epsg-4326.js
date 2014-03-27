var layers = [
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
      params: {
        'VERSION': '1.1.1',
        'LAYERS': 'basic',
        'FORMAT': 'image/jpeg'
      }
    })
  })
];

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.ScaleLine({
      units: 'degrees'
    })
  ]),
  layers: layers,
  // The OSgeo server does not set cross origin headers, so we cannot use WebGL
  renderer: ['canvas', 'dom'],
  target: 'map',
  view: new ol.View2D({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});
