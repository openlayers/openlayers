goog.require('ol.Coordinate');
goog.require('ol.Map2D');
goog.require('ol.RendererHints');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OpenStreetMap');


var map = new ol.Map2D({
  center: new ol.Coordinate(0, 0),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  zoom: 2
});
