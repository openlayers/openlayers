import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

proj4.defs(
  'stereo-sib',
  '+proj=stere +lat_0=49 +lat_ts=-73 +lon_0=90 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
);
register(proj4);

const size = 256;
const lineHeight = 30;

const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;

const context = canvas.getContext('2d');
context.lineWidth = 10;
context.strokeStyle = 'white';
context.textAlign = 'center';
context.font = `${lineHeight}px sans-serif`;

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        wrapX: false,
        url: '{z}{x}{y}',
        tileLoadFunction: function (tile, src) {
          const [z, x, y] = tile.getTileCoord();
          const half = size / 2;
          context.clearRect(0, 0, size, size);
          context.fillStyle = 'rgba(100, 100, 100, 0.5)';
          context.fillRect(0, 0, size, size);
          context.fillStyle = 'black';
          context.fillText(`z: ${z}`, half, half - lineHeight);
          context.fillText(`x: ${x}`, half, half);
          context.fillText(`y: ${y}`, half, half + lineHeight);
          context.strokeRect(0, 0, size, size);
          tile.getImage().src = canvas.toDataURL();
        },
        transition: 0,
      }),
    }),
  ],
  view: new View({
    projection: 'stereo-sib',
    center: fromLonLat([180, 55], 'stereo-sib'),
    resolution: 7000,
  }),
});

render({
  message: 'tiles are reprojected when wrapX is false',
});
