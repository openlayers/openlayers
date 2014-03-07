var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileJSON({
        url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp',
        crossOrigin: 'anonymous'
      })
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
