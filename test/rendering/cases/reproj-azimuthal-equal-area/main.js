import ImageCanvas from '../../../../src/ol/source/ImageCanvas.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import proj4 from 'proj4';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';

const llpos = [-72, 40];

proj4.defs(
  'az',
  '+proj=aeqd +lat_0=' +
    llpos[1] +
    ' +lon_0=' +
    llpos[0] +
    ' +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m'
);
register(proj4);
const aeqd = getProjection('az');

function canvasFunction(extent, resolution, pixelRatio, size) {
  size = [Math.round(size[0]), Math.round(size[1])];
  const canvas = document.createElement('canvas');
  canvas.width = size[0];
  canvas.height = size[1];

  // fill the canvas with blue
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

const canvasLayer = new ImageLayer({
  source: new ImageCanvas({
    projection: 'EPSG:4326',
    canvasFunction: canvasFunction,
  }),
});

const center = transform(llpos, 'EPSG:4326', aeqd);

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [canvasLayer],
  view: new View({
    center: center,
    projection: aeqd,
    zoom: 0,
  }),
});

render({
  tolerance: 0.001,
});
