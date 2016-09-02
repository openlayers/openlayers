goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileJSON');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
        crossOrigin: 'anonymous'
      })
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
