import DataTile from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const size = [81, 99];

const canvas = document.createElement('canvas');
canvas.width = size[0];
canvas.height = size[1];

const context = canvas.getContext('2d');
context.strokeStyle = 'white';
context.textAlign = 'center';
const lineHeight = 16;
context.font = `${lineHeight}px sans-serif`;

const sourceRed = new DataTile({
  loader: function (z, x, y) {
    const halfWidth = size[0] / 2;
    const halfHeight = size[1] / 2;
    context.fillStyle = '#FF0000';
    context.fillRect(0, 0, size[0], size[1]);
    context.fillStyle = 'white';
    context.fillText(`z: ${z}`, halfWidth, halfHeight - lineHeight);
    context.fillText(`x: ${x}`, halfWidth, halfHeight);
    context.fillText(`y: ${y}`, halfWidth, halfHeight + lineHeight);
    context.strokeRect(0, 0, size[0], size[1]);
    return context.getImageData(0, 0, size[0], size[1]).data;
  },
  tileSize: size,
});

const sourceBlue = new DataTile({
  loader: function (z, x, y) {
    const halfWidth = size[0] / 2;
    const halfHeight = size[1] / 2;
    context.fillStyle = '#00AAFF';
    context.fillRect(0, 0, size[0], size[1]);
    context.fillStyle = 'white';
    context.fillText(`z: ${z}`, halfWidth, halfHeight - lineHeight);
    context.fillText(`x: ${x}`, halfWidth, halfHeight);
    context.fillText(`y: ${y}`, halfWidth, halfHeight + lineHeight);
    context.strokeRect(0, 0, size[0], size[1]);
    return context.getImageData(0, 0, size[0], size[1]).data;
  },
  tileSize: size,
});

const layer = new TileLayer({
  source: sourceRed,
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});

map.once(`rendercomplete`, function () {
  layer.setSource(sourceBlue);
  render({tolerance: 0.03});
});
