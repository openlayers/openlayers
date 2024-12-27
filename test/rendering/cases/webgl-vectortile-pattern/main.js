import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MVT from '../../../../src/ol/format/MVT.js';
import WebGLVectorTileLayer from '../../../../src/ol/layer/WebGLVectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

// create patterns
const canvasFill = document.createElement('canvas');
canvasFill.width = 16;
canvasFill.height = 16;
let context = canvasFill.getContext('2d');
context.fillStyle = 'rgba(255, 0, 0, 0.7)';
context.fillRect(0, 0, 8, 8);
context.fillStyle = 'rgba(94, 255, 0, 0.7)';
context.fillRect(8, 0, 8, 8);
context.fillStyle = 'rgb(255, 213, 0)';
context.fillRect(8, 8, 8, 8);
context.fillStyle = 'rgba(255,255,255,0.62)';
context.fillRect(0, 8, 8, 8);
const canvasStroke = document.createElement('canvas');
canvasStroke.width = 8;
canvasStroke.height = 2;
context = canvasStroke.getContext('2d');
context.fillStyle = 'rgba(0,0,0,0.7)';
context.fillRect(0, 0, 4, 2);
context.fillStyle = 'rgba(255,0,0,0.7)';
context.fillRect(4, 0, 4, 2);

const map = new Map({
  layers: [
    new WebGLVectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: createXYZ(),
        url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        transition: 0,
      }),
      style: {
        'fill-pattern-src': canvasFill.toDataURL('png'),
        'stroke-pattern-src': canvasStroke.toDataURL('png'),
        'stroke-width': 1,
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 14,
  }),
});

map.getView().setRotation(Math.PI / 4);
render({message: 'Vector tile layer rotates', tolerance: 0.01});
