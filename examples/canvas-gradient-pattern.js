goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.GeoJSON');
goog.require('ol.has');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');

// Gradient and pattern are in canvas pixel space, so we adjust for the
// renderer's pixel ratio
var pixelRatio = ol.has.DEVICE_PIXEL_RATIO;

// Generate a rainbow gradient
function gradient(feature, resolution) {
  var extent = feature.getGeometry().getExtent();
  // Gradient starts on the left edge of each feature, and ends on the right.
  // Coordinate origin is the top-left corner of the extent of the geometry, so
  // we just divide the geometry's extent width by resolution and multiply with
  // pixelRatio to match the renderer's pixel coordinate system.
  var grad = context.createLinearGradient(0, 0,
      ol.extent.getWidth(extent) / resolution * pixelRatio, 0);
  grad.addColorStop(0, 'red');
  grad.addColorStop(1 / 6, 'orange');
  grad.addColorStop(2 / 6, 'yellow');
  grad.addColorStop(3 / 6, 'green');
  grad.addColorStop(4 / 6, 'aqua');
  grad.addColorStop(5 / 6, 'blue');
  grad.addColorStop(1, 'purple');
  return grad;
}

// Generate a canvasPattern with two circles on white background
var pattern = (function() {
  canvas.width = 11 * pixelRatio;
  canvas.height = 11 * pixelRatio;
  // white background
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  // outer circle
  context.fillStyle = 'rgba(102, 0, 102, 0.5)';
  context.beginPath();
  context.arc(5 * pixelRatio, 5 * pixelRatio, 4 * pixelRatio, 0, 2 * Math.PI);
  context.fill();
  // inner circle
  context.fillStyle = 'rgb(55, 0, 170)';
  context.beginPath();
  context.arc(5 * pixelRatio, 5 * pixelRatio, 2 * pixelRatio, 0, 2 * Math.PI);
  context.fill();
  return context.createPattern(canvas, 'repeat');
}());

// Generate style for gradient or pattern fill
var fill = new ol.style.Fill();
var style = new ol.style.Style({
  fill: fill,
  stroke: new ol.style.Stroke({
    color: '#333',
    width: 2
  })
});

/**
 * The styling function for the vector layer, will return an array of styles
 * which either contains the aboove gradient or pattern.
 *
 * @param {ol.Feature} feature The feature to style.
 * @param {number} resolution Resolution.
 * @return {ol.style.Style} The style to use for the feature.
 */
var getStackedStyle = function(feature, resolution) {
  var id = feature.getId();
  fill.setColor(id > 'J' ? gradient(feature, resolution) : pattern);
  return style;
};

// Create a vector layer that makes use of the style function above…
var vectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/geojson/countries.geojson',
    format: new ol.format.GeoJSON()
  }),
  style: getStackedStyle
});

// … finally create a map with that layer.
var map = new ol.Map({
  layers: [
    vectorLayer
  ],
  target: 'map',
  view: new ol.View({
    center: ol.proj.fromLonLat([7, 52]),
    zoom: 3
  })
});
