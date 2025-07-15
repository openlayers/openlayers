import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const line = new Feature({
  geometry: new LineString([
    [-900_000, -800_000],
    [-450_000, -400_000],
    [-90_000, -80_000],
    [90_000, 80_000],
    [450_000, 400_000],
    [900_000, 800_000],
  ]),
});

const dashed = {
  'stroke-color': 'rgb(0,104,218)',
  'stroke-offset': -50,
  'stroke-width': 25,
  'stroke-line-dash': [40, 40],
  'stroke-line-dash-offset': 10,
};
const pattern = {
  'stroke-offset': 10,
  'stroke-width': 60,
  'stroke-pattern-src': '/data/fish.png',
  'stroke-pattern-spacing': 20,
};
const patternAndDashed = {
  'stroke-color': 'rgb(0,104,218)',
  'stroke-offset': 70,
  'stroke-width': 60,
  'stroke-pattern-src': '/data/fish.png',
  'stroke-line-dash': [10, 10],
  'stroke-line-cap': 'butt',
};
const style = [dashed, pattern, patternAndDashed];

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features: [line],
  }),
  style,
});

new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 14,
  }),
});

render({
  message:
    'renders two lines side-by-side, extremely zoomed in, without visual glitches',
});
