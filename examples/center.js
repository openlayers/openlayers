goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var source = new ol.source.Vector({
  url: 'data/geojson/switzerland.geojson',
  format: new ol.format.GeoJSON()
});
var style = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new ol.style.Stroke({
    color: '#319FD3',
    width: 1
  }),
  image: new ol.style.Circle({
    radius: 5,
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: '#319FD3',
      width: 1
    })
  })
});
var vectorLayer = new ol.layer.Vector({
  source: source,
  style: style
});
var view = new ol.View({
  center: [0, 0],
  zoom: 1
});
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: view
});

var zoomtoswitzerlandbest = document.getElementById('zoomtoswitzerlandbest');
zoomtoswitzerlandbest.addEventListener('click', function() {
  var feature = source.getFeatures()[0];
  var polygon = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry());
  var size = /** @type {ol.Size} */ (map.getSize());
  view.fit(polygon, size, {padding: [170, 50, 30, 150], constrainResolution: false});
}, false);

var zoomtoswitzerlandconstrained =
    document.getElementById('zoomtoswitzerlandconstrained');
zoomtoswitzerlandconstrained.addEventListener('click', function() {
  var feature = source.getFeatures()[0];
  var polygon = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry());
  var size = /** @type {ol.Size} */ (map.getSize());
  view.fit(polygon, size, {padding: [170, 50, 30, 150]});
}, false);

var zoomtoswitzerlandnearest =
    document.getElementById('zoomtoswitzerlandnearest');
zoomtoswitzerlandnearest.addEventListener('click', function() {
  var feature = source.getFeatures()[0];
  var polygon = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry());
  var size = /** @type {ol.Size} */ (map.getSize());
  view.fit(polygon, size, {padding: [170, 50, 30, 150], nearest: true});
}, false);

var zoomtolausanne = document.getElementById('zoomtolausanne');
zoomtolausanne.addEventListener('click', function() {
  var feature = source.getFeatures()[1];
  var point = /** @type {ol.geom.SimpleGeometry} */ (feature.getGeometry());
  var size = /** @type {ol.Size} */ (map.getSize());
  view.fit(point, size, {padding: [170, 50, 30, 150], minResolution: 50});
}, false);

var centerlausanne = document.getElementById('centerlausanne');
centerlausanne.addEventListener('click', function() {
  var feature = source.getFeatures()[1];
  var point = /** @type {ol.geom.Point} */ (feature.getGeometry());
  var size = /** @type {ol.Size} */ (map.getSize());
  view.centerOn(point.getCoordinates(), size, [570, 500]);
}, false);
