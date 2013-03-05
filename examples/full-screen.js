goog.require('ol.AnchoredElement');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});
var map = new ol.Map({
  controls: ol.control.defaults({
    scaleLine: true
  }),
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

// This is silly: gjslint generates a "No docs found for member
// 'element.style.display'" without the auto-executing function.
(function() {
  element.style.display = 'block';
})();
