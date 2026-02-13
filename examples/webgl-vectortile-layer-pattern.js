import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import WebGLVectorTileLayer from '../src/ol/layer/WebGLVectorTile.js';
import OSM from '../src/ol/source/OSM.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

// create fill pattern (4-color checkerboard)
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

// create stroke pattern (dashed red/black)
const canvasStroke = document.createElement('canvas');
canvasStroke.width = 8;
canvasStroke.height = 2;
context = canvasStroke.getContext('2d');
context.fillStyle = 'rgba(0,0,0,0.7)';
context.fillRect(0, 0, 4, 2);
context.fillStyle = 'rgba(255,0,0,0.7)';
context.fillRect(4, 0, 4, 2);

const osm = new TileLayer({
  source: new OSM(),
});

const vectorTileLayer = new WebGLVectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: 'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
  }),
  style: {
    'fill-pattern-src': canvasFill.toDataURL('png'),
    'stroke-pattern-src': canvasStroke.toDataURL('png'),
    'stroke-width': 2,
  },
});

const map = new Map({
  layers: [osm, vectorTileLayer],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 1,
  }),
});
