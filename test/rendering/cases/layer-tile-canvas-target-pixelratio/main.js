import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const center = fromLonLat([8.6, 50.1]);
const pixelRatio = 2;

const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
document.getElementById('map').appendChild(canvas);

canvas.width = 256 * pixelRatio;
canvas.height = 256 * pixelRatio;
canvas.getContext('2d').scale(pixelRatio, pixelRatio);

new Map({
  pixelRatio,
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
    }),
  ],
  target: canvas,
  view: new View({
    center: center,
    zoom: 3,
  }),
});
render();
