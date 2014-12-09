goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.WKT');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var format = new ol.format.WKT();
var feature = format.readFeature(
    'POLYGON((10.689697265625 -25.0927734375, 34.595947265625 ' +
        '-20.1708984375, 38.814697265625 -35.6396484375, 13.502197265625 ' +
        '-39.1552734375, 10.689697265625 -25.0927734375))');
feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [feature]
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  target: 'map',
  view: new ol.View({
    center: [2952104.019976033, -3277504.823700756],
    zoom: 4
  })
});
