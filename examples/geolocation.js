// FIXME use an ol.geom.Circle to display a circle with accuracy
// FIXME this circle will need to compensate for the pointResolution of the
// FIXME EPSG:3857 projection

goog.require('ol.Feature');
goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.dom.Input');
goog.require('ol.layer.Tile');
goog.require('ol.render.FeaturesOverlay');
goog.require('ol.source.OSM');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


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
  renderer: ol.RendererHint.CANVAS,
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


var styleArray = [
  new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      stroke: null,
      fill: new ol.style.Fill({
        color: '#319FD3'
      })
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: '#319FD3',
      width: 1
    })
  })
];

var accuracyFeature = new ol.Feature();
accuracyFeature.bindTo('geometry', geolocation, 'accuracyGeometry');
var positionFeature = new ol.Feature();
positionFeature.bindTo('geometry', geolocation, 'positionGeometry');

var featuresOverlay = new ol.render.FeaturesOverlay({
  map: map,
  features: [accuracyFeature, positionFeature],
  styleFunction: function(feature, resolution) {
    return styleArray;
  }
});
