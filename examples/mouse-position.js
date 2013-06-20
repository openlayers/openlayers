goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.MousePosition');
goog.require('ol.control.defaults');
goog.require('ol.coordinate');
goog.require('ol.dom.Input');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
goog.require('ol.source.OSM');

var control = new ol.control.MousePosition({
  coordinateFormat: ol.coordinate.createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

var map = new ol.Map({
  controls: ol.control.defaults({}, [control]),
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

var projection = new ol.dom.Input(document.getElementById('projection'));
projection.on('change:value', function() {
  control.setProjection(ol.proj.get(projection.getValue()));
});

var precision = new ol.dom.Input(document.getElementById('precision'));
precision.on('change:value', function() {
  var format = ol.coordinate.createStringXY(precision.getValue());
  control.setCoordinateFormat(format);
});
