goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.TileJSON');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.TileJSON({
        uri: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp',
        crossOrigin: 'anonymous'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
