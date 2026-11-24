import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {setDefaultRenderer} from '../src/ol/renderer.js';
import OSM from '../src/ol/source/OSM.js';

setDefaultRenderer('webgpu');

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
