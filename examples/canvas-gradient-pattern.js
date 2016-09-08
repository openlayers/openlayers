goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

// Will contain ol.Style instances key by country.
var styleLookup = {};

// Generate a rainbow gradient
var gradient = (function() {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var grad = context.createLinearGradient(0,0,1000,0);
  grad.addColorStop(0, 'red');
  grad.addColorStop(1 / 6, 'orange');
  grad.addColorStop(2 / 6, 'yellow');
  grad.addColorStop(3 / 6, 'green');
  grad.addColorStop(4 / 6, 'aqua');
  grad.addColorStop(5 / 6, 'blue');
  grad.addColorStop(1, 'purple');
  return grad;
}());

// Generate a canvasPattern with two circles
var pattern = (function() {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  canvas.width = 11;
  canvas.height = 11;
  context.fillStyle = 'rgba(102, 0, 102, 0.5)';
  context.beginPath();
  context.arc(5, 5, 4, 0, 2 * Math.PI);
  context.fill();
  context.fillStyle = 'rgb(55, 0, 170)';
  context.beginPath();
  context.arc(5, 5, 2, 0, 2 * Math.PI);
  context.fill();
  return context.createPattern(canvas, 'repeat');
}());

// Generate a background style that all features will reuse
var backgroundStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#333',
    width: 2
  }),
  fill: new ol.style.Fill({
    color: '#fff'
  })
});

/**
 * The styling function for the vector layer, will return an array of styles
 * which either contains the aboove gradient or pattern.
 *
 * @param {ol.Feature} feature the feature to style.
 * @return {Array<ol.style.Style>} the styles to use for the feature.
 */
var getStackedStyle = function(feature) {
  var id = feature.getId();
  if (!styleLookup[id]) {
    var patternOrGradient;
    if (id > 'J') { // some shall get the gradient, others the pattern.
      patternOrGradient = gradient;
    } else {
      patternOrGradient = pattern;
    }
    // Store the style in the lookup, next call will just return the stored
    // style for the feature.
    styleLookup[id] = [
      // 1. Use the common background style
      //    (white fill and blackish stroke)
      backgroundStyle,
      // 2. On top of that, draw the pattern or gradient
      new ol.style.Style({
        fill: new ol.style.Fill({
          color: patternOrGradient
        })
      })
    ];
  }
  return styleLookup[id];
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
