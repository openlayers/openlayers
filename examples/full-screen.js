goog.require('ol.AnchoredElement');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});
var map = new ol.Map({
  layers: new ol.Collection([layer]),
  renderers: ol.RendererHints.createFromQueryData(),
  scaleLineControl: true,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 0
  })
});
var view2d = map.getView().getView2D();
view2d.fitExtent(view2d.getProjection().getExtent(), map.getSize());

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
