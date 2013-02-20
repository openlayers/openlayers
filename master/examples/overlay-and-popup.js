goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.overlay.Overlay');
goog.require('ol.source.MapQuestOpenAerial');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});
var map = new ol.Map({
  center: new ol.Coordinate(0, 0),
  layers: new ol.Collection([layer]),
  target: 'map',
  zoom: 2
});

// Vienna label
var vienna = new ol.overlay.Overlay({
  map: map,
  coordinate: ol.Projection.transformWithCodes(
      new ol.Coordinate(16.3725, 48.208889), 'EPSG:4326', 'EPSG:3857'),
  element: document.getElementById('vienna')
});

// Popup showing the position the user clicked
var popup = new ol.overlay.Overlay({
  map: map,
  element: document.getElementById('popup')
});
map.addEventListener('click', function(evt) {
  var coordinate = evt.getCoordinate();
  popup.getElement().innerHTML =
      'Welcome to ol3. The location you clicked was<br>' +
      ol.Coordinate.toStringHDMS(ol.Projection.transformWithCodes(
          coordinate, 'EPSG:3857', 'EPSG:4326'));
  popup.setCoordinate(coordinate);
});
