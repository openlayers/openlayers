var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.ZoomToExtent({
      extent: [
        813079.7791264898, 5929220.284081122,
        848966.9639063801, 5936863.986909639
      ]
    })
  ]),
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
