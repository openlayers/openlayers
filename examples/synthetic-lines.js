import Feature from '../src/ol/Feature.js';
import LineString from '../src/ol/geom/LineString.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Stroke, Style} from '../src/ol/style.js';

const count = 10000;
const features = new Array(count);

let startPoint = [0, 0];
let endPoint;

let delta, deltaX, deltaY;
let signX = 1;
let signY = -1;

// Create a square spiral.
let i;
for (i = 0; i < count; ++i) {
  delta = (i + 1) * 2500;
  if (i % 2 === 0) {
    signY *= -1;
  } else {
    signX *= -1;
  }
  deltaX = delta * signX;
  deltaY = delta * signY;
  endPoint = [startPoint[0] + deltaX, startPoint[1] + deltaY];
  features[i] = new Feature({
    'geometry': new LineString([startPoint, endPoint]),
  });
  startPoint = endPoint;
}

const vector = new VectorLayer({
  source: new VectorSource({
    features: features,
    wrapX: false,
  }),
  style: new Style({
    stroke: new Stroke({
      color: '#666666',
      width: 1,
    }),
  }),
});

const view = new View({
  center: [0, 0],
  zoom: 0,
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: view,
});
