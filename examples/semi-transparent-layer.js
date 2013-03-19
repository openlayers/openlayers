goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.MapQuestOpenAerial');
goog.require('ol.source.TileJSON');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.MapQuestOpenAerial()
    }),
    new ol.layer.TileLayer({
      source: new ol.source.TileJSON({
        url: 'http://api.tiles.mapbox.com/v3/mapbox.va-quake-aug.jsonp',
        crossOrigin: 'anonymous'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  // ol.View2DOptions typecast required only when example
  // code is compiled with Closure Compiler
  view: /** @type {ol.View2DOptions} */ ({
    center: ol.projection.transform(
        new ol.Coordinate(-77.93255, 37.9555), 'EPSG:4326', 'EPSG:3857'),
    zoom: 5
  })
});
