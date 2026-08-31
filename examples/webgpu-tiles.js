import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WebGPUTileLayer from '../src/ol/layer/WebGPUTile.js';
import OSM from '../src/ol/source/OSM.js';

const map = new Map({
  target: 'map',
  layers: [
    new WebGPUTileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
