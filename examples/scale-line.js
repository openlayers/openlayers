goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.defaults');
goog.require('ol.dom.Input');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


var scaleLineControl = new ol.control.ScaleLine();

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    scaleLineControl
  ]),
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OSM()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});


var unitsSelect = new ol.dom.Input(document.getElementById('units'));
unitsSelect.bindTo('value', scaleLineControl, 'units');
