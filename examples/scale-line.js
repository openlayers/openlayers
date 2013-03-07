goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OpenStreetMap');


var map = new ol.Map({
  controls: ol.control.defaults({}, [
    new ol.control.ScaleLine({
      units: ol.control.ScaleLineUnits.IMPERIAL
    })
  ]),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
