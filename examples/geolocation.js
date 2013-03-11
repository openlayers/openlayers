goog.require('ol.AnchoredElement');
goog.require('ol.Coordinate');
goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OpenStreetMap');


var map = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.OpenStreetMap()
    })
  ],
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});

var geolocation = new ol.Geolocation();
geolocation.bindTo('projection', map.getView());

var marker = new ol.AnchoredElement({
  map: map,
  element: /** @type {Element} */ ($('<i/>').addClass('icon-flag').get(0))
});
// bind the marker position to the device location.
marker.bindTo('position', geolocation);

geolocation.addEventListener('accuracy_changed', function() {
  $(marker.getElement()).tooltip({
    title: this.getAccuracy() + 'm from this point'
  });
});

$('#locate').click(function() {
  geolocation.setTracking(true);
});
