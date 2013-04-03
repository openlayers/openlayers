goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.Stamen');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      preload: 4,
      source: new ol.source.Stamen({
        layer: 'watercolor'
      })
    }),
    new ol.layer.TileLayer({
      source: new ol.source.Stamen({
        layer: 'terrain-labels'
      })
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  // ol.View2DOptions typecast required only when example
  // code is compiled with Closure Compiler
  view: /** @type {ol.View2DOptions} */ ({
    center: ol.projection.transform(
        new ol.Coordinate(-122.416667, 37.783333), 'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});
