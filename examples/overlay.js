goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.View');
goog.require('ol.coordinate');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');


var layer = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var map = new ol.Map({
  layers: [layer],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var pos = ol.proj.fromLonLat([16.3725, 48.208889]);

// Vienna marker
var marker = new ol.Overlay({
  position: pos,
  positioning: 'center-center',
  element: document.getElementById('marker'),
  stopEvent: false
});
map.addOverlay(marker);

// Vienna label
var vienna = new ol.Overlay({
  position: pos,
  element: document.getElementById('vienna')
});
map.addOverlay(vienna);

// Popup showing the position the user clicked
var popup = new ol.Overlay({
  element: document.getElementById('popup')
});
map.addOverlay(popup);

map.on('click', function(evt) {
  var element = popup.getElement();
  var coordinate = evt.coordinate;
  var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
      coordinate, 'EPSG:3857', 'EPSG:4326'));

  $(element).popover('destroy');
  popup.setPosition(coordinate);
  // the keys are quoted to prevent renaming in ADVANCED mode.
  $(element).popover({
    'placement': 'top',
    'animation': false,
    'html': true,
    'content': '<p>The location you clicked was:</p><code>' + hdms + '</code>'
  });
  $(element).popover('show');
});
