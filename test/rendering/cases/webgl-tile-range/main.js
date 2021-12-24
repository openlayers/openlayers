import DataTile from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import {Projection} from '../../../../src/ol/proj.js';

const size = 256;
const data = new Uint8Array(size * size * 4);
for (let row = 0; row < size; ++row) {
  for (let col = 0; col < size; ++col) {
    const index = (row * size + col) * 4;
    data[index] = 0;
    data[index + 1] = 255;
    data[index + 2] = 0;
    data[index + 3] = 255;
  }
}

const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;

const context = canvas.getContext('2d');
context.strokeStyle = 'black';

function getLabels(z, x, y) {
  context.clearRect(0, 0, size, size);
  context.strokeRect(0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  return new Uint8Array(data.buffer);
}

document.getElementById('map').style.background = 'red';

const projection = new Projection({
  code: 'pixels',
  units: 'pixels',
  extent: [0, 0, 256, 256],
});

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        projection: projection,
        maxZoom: 1,
        tileSize: size,
        loader: () => data,
      }),
    }),
    new TileLayer({
      source: new DataTile({
        projection: projection,
        loader: getLabels,
        transition: 0,
      }),
    }),
  ],
  view: new View({
    projection: projection,
    center: [127.7, 128.3],
    zoom: 8,
  }),
});

render();
