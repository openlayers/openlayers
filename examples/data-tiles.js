import DataTile from '../src/ol/source/DataTile.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';

const hiDPI = DEVICE_PIXEL_RATIO >= 1.5;
const tilePixelRatio = hiDPI ? 2 : 1;

const size = 256 * tilePixelRatio;
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;

const context = canvas.getContext('2d');
context.strokeStyle = 'white';
context.lineWidth = tilePixelRatio;
context.textAlign = 'center';
context.font = 24 * tilePixelRatio + 'px sans-serif';
const lineHeight = 30 * tilePixelRatio;

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        loader: function (z, x, y) {
          const half = size / 2;
          context.clearRect(0, 0, size, size);
          context.fillStyle = 'rgba(100, 100, 100, 0.5)';
          context.fillRect(0, 0, size, size);
          context.fillStyle = hiDPI ? 'red' : 'black';
          context.fillText(`z: ${z}`, half, half - lineHeight);
          context.fillText(`x: ${x}`, half, half);
          context.fillText(`y: ${y}`, half, half + lineHeight);
          context.strokeRect(0, 0, size, size);
          const data = context.getImageData(0, 0, size, size).data;
          // converting to Uint8Array for increased browser compatibility
          return new Uint8Array(data.buffer);
        },
        tilePixelRatio: tilePixelRatio,
        // disable opacity transition to avoid overlapping labels during tile loading
        transition: 0,
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});
