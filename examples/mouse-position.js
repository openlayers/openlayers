goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.control.MousePosition');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OpenStreetMap');


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new ol.control.MousePosition({
      coordinateFormat: ol.Coordinate.toStringHDMS,
      projection: 'EPSG:4326',
      target: document.getElementById('mouse-position'),
      undefinedHTML: '&nbsp;'
    })
  ]),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
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
