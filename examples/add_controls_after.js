goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.MousePosition');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.coordinate');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');

var map = new ol.Map({
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

var scaleLine = new ol.control.ScaleLine({
  units: ol.control.ScaleLineUnits.IMPERIAL,
  map: map
});


var mousePosition = new ol.control.MousePosition({
  coordinateFormat: ol.coordinate.createStringXY(2),
  projection: 'EPSG:4326',
  //target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;',
  map: map
});
