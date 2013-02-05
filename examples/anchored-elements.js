goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('ol.AnchoredElement');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


if (goog.DEBUG) {
  goog.debug.Console.autoInstall();
  goog.debug.Logger.getLogger('ol').setLevel(goog.debug.Logger.Level.INFO);
}


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var map = new ol.Map({
  layers: new ol.Collection([layer]),
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});

// Vienna label
var vienna = new ol.AnchoredElement({
  map: map,
  position: ol.Projection.transformWithCodes(
      new ol.Coordinate(16.3725, 48.208889), 'EPSG:4326', 'EPSG:3857'),
  element: document.getElementById('vienna')
});

// Popup showing the position the user clicked
var popup = new ol.AnchoredElement({
  map: map,
  element: document.getElementById('popup')
});
map.addEventListener('click', function(evt) {
  var coordinate = evt.getCoordinate();
  popup.getElement().innerHTML =
      'Welcome to ol3. The location you clicked was<br>' +
      ol.Coordinate.toStringHDMS(ol.Projection.transformWithCodes(
          coordinate, 'EPSG:3857', 'EPSG:4326'));
  popup.setPosition(coordinate);
});
