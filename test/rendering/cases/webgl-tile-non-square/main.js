import DataTile from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const extent = [-1000, -500, 1000, 500];
const projection = new Projection({
  code: 'test',
  units: 'pixels',
  extent: extent,
});

const width = 200;
const height = 100;

const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;

const context = canvas.getContext('2d');
context.strokeStyle = 'red';
context.textAlign = 'center';
context.font = '16px sans-serif';
const lineHeight = 20;

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        projection: projection,
        tileSize: [width, height],
        loader: function (z, x, y) {
          const halfWidth = width / 2;
          const halfHeight = height / 2;
          context.clearRect(0, 0, width, height);
          context.fillStyle = 'rgba(100, 100, 100, 0.5)';
          context.fillRect(0, 0, width, height);
          context.fillStyle = 'black';
          context.fillText(`z: ${z}`, halfWidth, halfHeight - lineHeight);
          context.fillText(`x: ${x}`, halfWidth, halfHeight);
          context.fillText(`y: ${y}`, halfWidth, halfHeight + lineHeight);
          context.strokeRect(0, 0, width, height);
          return context.getImageData(0, 0, width, height).data;
        },
        transition: 0,
      }),
    }),
  ],
  view: new View({
    projection: projection,
    showFullExtent: true,
    center: [0, 0],
    rotation: Math.PI / 4,
    zoom: 0,
  }),
});

render({
  message: 'properly renders rotated non-square tiles',
});
