goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.TileJSON');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.TileJSON({
        url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp',
        crossOrigin: 'anonymous'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  // ol.View2DOptions typecast required only when example
  // code is compiled with Closure Compiler
  view: /** @type {ol.View2DOptions} */ ({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
