import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

// center in Europe, far from world origin [0,0] in EPSG:3857
const center = [1113195, 6446275];

// polygon covering the viewport at zoom 20 (~38m across in a 256px viewport)
const offset = 100;
const polygon = new Feature({
  geometry: new Polygon([
    [
      [center[0] - offset, center[1] - offset],
      [center[0] + offset, center[1] - offset],
      [center[0] + offset, center[1] + offset],
      [center[0] - offset, center[1] + offset],
      [center[0] - offset, center[1] - offset],
    ],
  ]),
});

// create a simple 16x16 checkerboard pattern
const canvas = document.createElement('canvas');
canvas.width = 16;
canvas.height = 16;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#e74c3c';
ctx.fillRect(0, 0, 16, 16);
ctx.fillStyle = '#3498db';
ctx.fillRect(0, 0, 8, 8);
ctx.fillRect(8, 8, 8, 8);

const style = {
  'fill-pattern-src': canvas.toDataURL('image/png'),
  'stroke-color': 'white',
  'stroke-width': 2,
};

const vector = new WebGLVectorLayer({
  source: new VectorSource({
    features: [polygon],
  }),
  style,
});

new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: center,
    zoom: 20,
  }),
});

render({
  message:
    'fill pattern renders correctly when zoomed in far from world origin',
  tolerance: 0.01,
});
