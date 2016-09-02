// NOCOMPILE
// this example uses turf.js for which we don't have an externs file.
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');


var source = new ol.source.Vector();
fetch('data/geojson/roads-seoul.geojson').then(function(response) {
  return response.json();
}).then(function(json) {
  var format = new ol.format.GeoJSON();
  var features = format.readFeatures(json);
  var street = features[0];

  // convert to a turf.js feature
  var turfLine = format.writeFeatureObject(street);

  // show a marker every 200 meters
  var distance = 0.2;

  // get the line length in kilometers
  var length = turf.lineDistance(turfLine, 'kilometers');
  for (var i = 1; i <= length / distance; i++) {
    var turfPoint = turf.along(turfLine, i * distance, 'kilometers');

    // convert the generated point to a OpenLayers feature
    var marker = format.readFeature(turfPoint);
    marker.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    source.addFeature(marker);
  }

  street.getGeometry().transform('EPSG:4326', 'EPSG:3857');
  source.addFeature(street);
});
var vectorLayer = new ol.layer.Vector({
  source: source
});

var rasterLayer = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var map = new ol.Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new ol.View({
    center: ol.proj.fromLonLat([126.980366, 37.526540]),
    zoom: 15
  })
});
