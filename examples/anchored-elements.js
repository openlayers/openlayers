goog.require('ol.AnchoredElement');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.MapQuestOpenAerial');


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var map = new ol.Map({
  layers: [layer],
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
  position: ol.projection.transformWithCodes(
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
      ol.Coordinate.toStringHDMS(ol.projection.transformWithCodes(
          coordinate, 'EPSG:3857', 'EPSG:4326'));
  popup.setPosition(coordinate);
});
