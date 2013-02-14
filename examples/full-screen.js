goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.style');
goog.require('ol.AnchoredElement');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Geolocation');
goog.require('ol.Map');
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
    zoom: 0
  })
});

var geolocation = new ol.Geolocation();
geolocation.bindTo('projection', map.getView());

var element = document.getElementById('geolocation');
var marker = new ol.AnchoredElement({
  map: map,
  element: element
});
marker.bindTo('position', geolocation);
goog.style.showElement(element, true);
