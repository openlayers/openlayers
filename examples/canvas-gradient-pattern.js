import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getWidth} from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

// Gradient and pattern are in canvas pixel space, so we adjust for the
// renderer's pixel ratio
const pixelRatio = DEVICE_PIXEL_RATIO;

// Generate a rainbow gradient
function gradient(feature, resolution) {
  const extent = feature.getGeometry().getExtent();
  // Gradient starts on the left edge of each feature, and ends on the right.
  // Coordinate origin is the top-left corner of the extent of the geometry, so
  // we just divide the geometry's extent width by resolution and multiply with
  // pixelRatio to match the renderer's pixel coordinate system.
  const grad = context.createLinearGradient(0, 0,
    getWidth(extent) / resolution * pixelRatio, 0);
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
const pattern = (function() {
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
const fill = new Fill();
const style = new Style({
  fill: fill,
  stroke: new Stroke({
    color: '#333',
    width: 2
  })
});

/**
 * The styling function for the vector layer, will return an array of styles
 * which either contains the aboove gradient or pattern.
 *
 * @param {module:ol/Feature~Feature} feature The feature to style.
 * @param {number} resolution Resolution.
 * @return {ol.style.Style} The style to use for the feature.
 */
const getStackedStyle = function(feature, resolution) {
  const id = feature.getId();
  fill.setColor(id > 'J' ? gradient(feature, resolution) : pattern);
  return style;
};

// Create a vector layer that makes use of the style function above…
const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  }),
  style: getStackedStyle
});

// … finally create a map with that layer.
const map = new Map({
  layers: [
    vectorLayer
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([7, 52]),
    zoom: 3
  })
});
