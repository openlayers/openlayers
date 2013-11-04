goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.MousePosition');
goog.require('ol.coordinate');
goog.require('ol.dom.Input');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');

var mousePositionControl = new ol.control.MousePosition({
  coordinateFormat: ol.coordinate.createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

var map = new ol.Map({
  controls: ol.control.defaults().extend([mousePositionControl]),
  layers: [
    new ol.layer.Tile({
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

var projectionSelect = new ol.dom.Input(document.getElementById('projection'));
projectionSelect.on('change:value', function() {
  mousePositionControl.setProjection(ol.proj.get(projectionSelect.getValue()));
});

var precisionInput = document.getElementById('precision');
precisionInput.addEventListener('change', function() {
  var format = ol.coordinate.createStringXY(precisionInput.valueAsNumber);
  mousePositionControl.setCoordinateFormat(format);
}, false);
