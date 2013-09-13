var layers = [
  new ol.layer.Tile({
    source: new ol.source.MapQuestOpenAerial()
  }),
  new ol.layer.Image({
    source: new ol.source.ImageWMS({
      url: 'http://demo.opengeo.org/geoserver/wms',
      params: {'LAYERS': 'topp:states'},
      extent: [-13884991, -7455066, 2870341, 6338219]
    })
  })
];
var map = new ol.Map({
  renderer: ol.RendererHint.CANVAS,
  layers: layers,
  target: 'map',
  view: new ol.View2D({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
