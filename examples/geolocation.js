// FIXME use an ol.geom.Circle to display a circle with accuracy
// FIXME this circle will need to compensate for the pointResolution of the
// FIXME EPSG:3857 projection

goog.require('ol.Feature');
goog.require('ol.FeatureOverlay');
goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var view = new ol.View2D({
  center: [0, 0],
  zoom: 2
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: view
});

var geolocation = new ol.Geolocation();
geolocation.bindTo('projection', view);

var track = new ol.dom.Input(document.getElementById('track'));
track.bindTo('checked', geolocation, 'tracking');

geolocation.on('propertychange', function() {
  $('#accuracy').text(geolocation.getAccuracy() + ' [m]');
  $('#altitude').text(geolocation.getAltitude() + ' [m]');
  $('#altitudeAccuracy').text(geolocation.getAltitudeAccuracy() + ' [m]');
  $('#heading').text(geolocation.getHeading() + ' [rad]');
  $('#speed').text(geolocation.getSpeed() + ' [m/s]');
});

geolocation.on('error', function(error) {
  var info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});


var accuracyFeature = new ol.Feature();
accuracyFeature.bindTo('geometry', geolocation, 'accuracyGeometry');

var positionFeature = new ol.Feature();
positionFeature.bindTo('geometry', geolocation, 'position')
    .transform(function() {}, function(coordinates) {
      return coordinates ? new ol.geom.Point(coordinates) : null;
    });

var featuresOverlay = new ol.FeatureOverlay({
  map: map,
  features: [accuracyFeature, positionFeature]
});
