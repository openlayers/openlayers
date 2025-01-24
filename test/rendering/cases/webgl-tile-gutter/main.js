import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const sizeX = 512;
const sizeY = 384;
const gutter = 20;

const canvas = document.createElement('canvas');
canvas.width = sizeX + 2 * gutter;
canvas.height = sizeY + 2 * gutter;
const context = canvas.getContext('2d');
context.fillStyle = 'white';
context.fillRect(0, 0, canvas.width, canvas.height);
context.fillStyle = 'red';
let excess = 1;
context.fillRect(
  gutter + excess,
  gutter + excess,
  sizeX - 2 * excess,
  sizeY - 2 * excess,
);
context.fillStyle = 'green';
excess = 21;
context.fillRect(
  gutter + excess,
  gutter + excess,
  sizeX - 2 * excess,
  sizeY - 2 * excess,
);
const url = canvas.toDataURL();

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: url,
        gutter: gutter,
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

render();
