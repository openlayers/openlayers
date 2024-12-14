import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

const polygon1 = new Feature({
  geometry: new Polygon([
    [
      [-100, -100],
      [-10, -100],
      [-10, -10],
      [-100, -10],
      [-100, -100],
    ],
  ]),
});
const polygon2 = new Feature({
  geometry: new Polygon([
    [
      [100, -100],
      [10, -100],
      [10, -10],
      [100, -10],
      [100, -100],
    ],
  ]),
});
const polygon3 = new Feature({
  geometry: new Polygon([
    [
      [-100, 100],
      [100, 100],
      [100, 10],
      [-100, 10],
      [-100, 100],
    ],
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
context.fillRect(2, 2, 60, 60);

const srcPattern = {
  'fill-pattern-src': '/data/fish.png',
};
const imagePattern = {
  'fill-pattern-src': canvas.toDataURL('png'),
};
const subImageTint = {
  'fill-pattern-src': '/data/sprites/bright-v9/sprite.png',
  'fill-pattern-offset': [294, 0],
  'fill-pattern-size': [21, 21],
  'fill-color': 'red',
};

const vector1 = new VectorLayer({
  style: srcPattern,
  source: new VectorSource({
    features: [polygon1],
  }),
});
const vector2 = new VectorLayer({
  style: imagePattern,
  source: new VectorSource({
    features: [polygon2],
  }),
});
const vector3 = new VectorLayer({
  style: subImageTint,
  source: new VectorSource({
    features: [polygon3],
  }),
});

new Map({
  layers: [vector1, vector2, vector3],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    zoom: 1,
  }),
});

render({
  message: 'renders four polygons with various pattern fills',
});
