var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.MapQuestOpenAerial()
    }),
    new ol.layer.TileLayer({
      source: new ol.source.TileJSON({
        uri: 'http://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.jsonp'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: ol.projection.transform(
        new ol.Coordinate(-77.93255, 37.9555), 'EPSG:4326', 'EPSG:3857'),
    zoom: 5
  })
});
