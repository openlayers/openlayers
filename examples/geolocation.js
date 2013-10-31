goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.OverlayPositioning');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
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

var geolocation = new ol.Geolocation();
geolocation.bindTo('projection', map.getView());

var track = new ol.dom.Input(document.getElementById('track'));
track.bindTo('checked', geolocation, 'tracking');

geolocation.on('change', function() {
  $('#accuracy').text(geolocation.getAccuracy() + ' [m]');
  $('#altitude').text(geolocation.getAltitude() + ' [m]');
  $('#altitudeAccuracy').text(geolocation.getAltitudeAccuracy() + ' [m]');
  $('#heading').text(geolocation.getHeading() + ' [rad]');
  $('#speed').text(geolocation.getSpeed() + ' [m/s]');
});

var marker = new ol.Overlay({
  element: /** @type {Element} */ ($('<i/>').addClass('icon-flag').get(0)),
  positioning: ol.OverlayPositioning.BOTTOM_LEFT,
  stopEvent: false
});
map.addOverlay(marker);
// bind the marker position to the device location.
marker.bindTo('position', geolocation);

geolocation.on('change:accuracy', function() {
  $(marker.getElement()).tooltip({
    title: this.getAccuracy() + 'm from this point'
  });
});
geolocation.on('error', function(error) {
  var info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});
