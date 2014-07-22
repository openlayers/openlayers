// NOCOMPILE
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.geom.LineString');
goog.require('ol.geom.flat.geodesic');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var features = [];

var coordinates = [[
  -(122 + 19 / 60 + 59 / 3600), (47 + 36 / 60 + 35 / 3600), // Seattle
  (2 + 21 / 60 + 3 / 3600), (48 + 51 / 60 + 24 / 3600) // Paris
], [
  (21 + 1 / 60), (52 + 14 / 60), // Warsaw
  (174 + 46 / 60 + 38 / 3600), -(41 + 17 / 60 + 20 / 3600) // Wellington
], [
  (12 + 30 / 60), (41 + 54 / 60), // Rome
  (47 + 31 / 60), -(18 + 56 / 60) // Antananarivo
], [
  (6 + 9 / 50), (46 + 12 / 60), // Geneva
  -(130 + 6 / 60), -(25 + 4 / 60) // Pitcairn Islands
], [
  -(70 + 40 / 60), -(33 + 26 / 60), // Santiago
  //(151 + 12 / 60 + 40 / 3600), -(33 + 51 + 35.9 / 3600) // Sydney
  (18 + 25 / 60 + 26 / 3600), -(33 + 55 / 60 + 31 / 3600) // Cape Town
]];

var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
var squaredTolerance = 1e6;

var i, ii;
for (i = 0, ii = coordinates.length; i < ii; ++i) {
  var lon1 = coordinates[i][0];
  var lat1 = coordinates[i][1];
  var lon2 = coordinates[i][2];
  var lat2 = coordinates[i][3];
  var flatCoordinates = ol.geom.flat.geodesic.line(
      lon1, lat1, lon2, lat2, transform, squaredTolerance);
  var lineString = new ol.geom.LineString(null);
  lineString.setFlatCoordinates(ol.geom.GeometryLayout.XY, flatCoordinates);
  var feature = new ol.Feature(lineString);
  features.push(feature);
}

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        features: features
      }),
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#f00',
          lineDash: [1, 2],
          width: 2
        })
      })
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
