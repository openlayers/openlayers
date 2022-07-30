import KML from '../src/ol/format/KML.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';
import {fromLonLat} from '../src/ol/proj.js';

// Gradient and pattern are in canvas pixel space, so we adjust for the
// renderer's pixel ratio
const pixelRatio = DEVICE_PIXEL_RATIO;

// Generate a rainbow gradient
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 1024 * pixelRatio, 0);
gradient.addColorStop(0, 'red');
gradient.addColorStop(1 / 6, 'orange');
gradient.addColorStop(2 / 6, 'yellow');
gradient.addColorStop(3 / 6, 'green');
gradient.addColorStop(4 / 6, 'aqua');
gradient.addColorStop(5 / 6, 'blue');
gradient.addColorStop(1, 'purple');

const vectorLayer = new VectorLayer({
  background: 'white',
  source: new VectorSource({
    url: 'data/kml/states.kml',
    format: new KML({extractStyles: false}),
  }),
  style: {
    'fill-color': gradient,
    'stroke-width': 1,
    'stroke-color': '#333',
  },
});

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: fromLonLat([-100, 38.5]),
    zoom: 4,
  }),
});
