import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const view = new View({
  center: [-4808600, -2620936],
  zoom: 8,
});

const map1 = new Map({
  layers: [
    new TileLayer({
      preload: Infinity,
      source: new OSM({}),
    }),
  ],
  target: 'map1',
  view: view,
});

const map2 = new Map({
  layers: [
    new TileLayer({
      preload: 0, // default value
      source: new OSM({}),
    }),
  ],
  target: 'map2',
  view: view,
});
