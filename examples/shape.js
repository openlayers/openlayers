goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.View2D');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.TileJSON');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Shape');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


/**
 * Shape inputs.
 */
var pathSelect = document.getElementById('path');
var svgRow = document.getElementById('svgrow');
var svgpathInput = document.getElementById('svgpath');
var scaleInput = document.getElementById('scale');
var rotationInput = document.getElementById('rotation');
var fillInput = document.getElementById('filled');
var strokeInput = document.getElementById('stroked');
var strokewidthInput = document.getElementById('strokewidth');
var anchorXInput = document.getElementById('anchorX');
var anchorYInput = document.getElementById('anchorY');


/**
 * Elements that make up the popup.
 */
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');


/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
  container.style.display = 'none';
  closer.blur();
  return false;
};

var rasterLayer = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp'
  })
});

var feature = new ol.Feature({
  geometry: new ol.geom.Point([0, 0])
});

feature.setStyle(getFeatureStyle);

var vectorSource = new ol.source.Vector({
  features: [feature]
});

var vectorLayer = new ol.layer.Vector({
  source: vectorSource
});

var overlay = new ol.Overlay({
  element: container
});

var map = new ol.Map({
  layers: [rasterLayer, vectorLayer],
  renderer: 'canvas',
  overlays: [overlay],
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});

function getFeatureStyle() {
  return [new ol.style.Style({
    image: new ol.style.Shape(/** @type {olx.style.ShapeOptions} */({
      path: pathSelect.value === 'svg' ? svgpathInput.value : pathSelect.value,
      scale: parseInt(scaleInput.value, 10),
      rotation: parseInt(rotationInput.value, 10) * Math.PI / 180,
      fill: fillInput.checked ? new ol.style.Fill({
        color: '#f00'
      }) : null,
      stroke: strokeInput.checked ? new ol.style.Stroke({
        color: '#00f',
        width: parseInt(strokewidthInput.value, 10)
      }) : null,
      anchor: [parseInt(anchorXInput.value, 10),
        parseInt(anchorYInput.value, 10)]
    }))
  })];
}

pathSelect.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

svgpathInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

scaleInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

rotationInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

fillInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

strokeInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

strokewidthInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

anchorXInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);

anchorYInput.addEventListener('change', function() {
  feature.dispatchChangeEvent();
}, false);


/**
 * Add a click handler to the map to render the popup.
 */
map.on('click', function(evt) {

  var feature = map.forEachFeatureAtPixel(evt.pixel,
      function(feature) {
        return feature;
      });
  if (feature) {
    var coordinate = evt.coordinate;
    overlay.setPosition(coordinate);
    content.innerHTML = '<p>You clicked a shape</p>';
    container.style.display = 'block';
  }
  else {
    container.style.display = 'none';
  }
});
