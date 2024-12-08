import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import DataTile from '../../../../src/ol/source/DataTile.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';

proj4.defs(
  'stereo-sib',
  '+proj=stere +lat_0=49 +lat_ts=-73 +lon_0=90 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
);
register(proj4);

const tileSize = 512;
const size = 256;
const scale = tileSize / size;
const lineHeight = 30;

const canvas = document.createElement('canvas');
canvas.width = tileSize;
canvas.height = tileSize;

const context = canvas.getContext('2d');
context.scale(scale, scale);
context.lineWidth = 10;
context.strokeStyle = 'white';
context.textAlign = 'center';
context.font = `${lineHeight}px sans-serif`;

const tileGrid = new TileGrid({
  extent: [-180, 15, 180, 90],
  origin: [-180, 90],
  resolutions: [0.288, 0.144, 0.072, 0.036],
  tileSize: tileSize,
});

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        tileGrid: tileGrid,
        projection: 'EPSG:4326',
        loader: function (z, x, y) {
          const half = size / 2;
          context.clearRect(0, 0, size, size);
          context.fillStyle = 'rgba(100, 100, 100, 0.5)';
          context.fillRect(0, 0, size, size);
          context.fillStyle = 'black';
          context.fillText(`z: ${z}`, half, half - lineHeight);
          context.fillText(`x: ${x}`, half, half);
          context.fillText(`y: ${y}`, half, half + lineHeight);
          context.strokeRect(0, 0, size, size);
          return context.getImageData(0, 0, tileSize, tileSize).data;
        },
        transition: 0,
      }),
    }),
  ],
  view: new View({
    projection: 'stereo-sib',
    center: fromLonLat([180, 72], 'stereo-sib'),
    resolution: 10000,
  }),
});

render({
  message: 'data tiles are reprojected when wrapX is false',
});
