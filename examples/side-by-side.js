import Map from '../src/ol/Map.js';
import WebGLMap from '../src/ol/WebGLMap.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLTileLayer from '../src/ol/layer/WebGLTile.js';
import OSM from '../src/ol/source/OSM.js';

const layer = new TileLayer({
  source: new OSM()
});

const webGLLayer = new WebGLTileLayer({
  source: new OSM()
});

const view = new View({
  center: [0, 0],
  zoom: 1
});

const map1 = new Map({
  target: 'canvasMap',
  layers: [layer],
  view: view
});

const map2 = new WebGLMap({
  target: 'webglMap',
  layers: [webGLLayer],
  view: view
});
