var layers = [
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
      url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
      crossOrigin: null,
      params: {
        'VERSION': '1.1.1',
        'LAYERS': 'basic',
        'FORMAT': 'image/jpeg'
      }
    })
  })
];

var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new ol.control.ScaleLine({
      units: ol.control.ScaleLineUnits.DEGREES
    })
  ]),
  layers: layers,
  // The OSgeo server does not set cross origin headers, so we cannot use WebGL
  renderers: [ol.RendererHint.CANVAS, ol.RendererHint.DOM],
  target: 'map',
  view: new ol.View2D({
    projection: 'EPSG:4326',
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
