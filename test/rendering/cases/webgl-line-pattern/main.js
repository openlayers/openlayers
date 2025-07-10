import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const line = new Feature({
  geometry: new LineString([
    [100, -80],
    [-10, -80],
    [-80, -20],
    [-80, 50],
    [-10, 80],
    [100, 80],
  ]),
});

// create pattern
const canvas = document.createElement('canvas');
canvas.width = 64;
canvas.height = 64;
const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, 'rgba(11,152,167,1)');
gradient.addColorStop(1, 'rgba(255,0,204,1)');
context.fillStyle = gradient;
context.beginPath();
context.arc(32, 32, 28, 0, 2 * Math.PI);
context.fill();

const srcPattern = {
  'stroke-pattern-src': '/data/fish.png',
  'stroke-pattern-spacing': 10,
  'stroke-pattern-start-offset': 10,
  'stroke-width': 20,
  'stroke-offset': -32,
};
const imagePattern = {
  'stroke-pattern-src': canvas.toDataURL('png'),
  'stroke-width': 16,
  'stroke-offset': -12,
};
const withTint = {
  'stroke-pattern-src': '/data/sprites/gis_symbols.png',
  'stroke-pattern-spacing': 2,
  'stroke-color': 'red',
  'stroke-offset': 12,
  'stroke-width': 16,
};
const subImage = {
  'stroke-pattern-src': '/data/sprites/bright-v9/sprite.png',
  'stroke-pattern-offset': [63, 21],
  'stroke-pattern-offset-origin': 'top-right',
  'stroke-pattern-size': [21, 21],
  'stroke-pattern-spacing': 4,
  'stroke-width': 20,
  'stroke-offset': 32,
};
const style = [srcPattern, imagePattern, withTint, subImage];

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features: [line],
  }),
  style,
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    zoom: 1,
  }),
});

map.once('rendercomplete', () => {
  render({
    message: 'renders lines with various patterns',
  });
});
