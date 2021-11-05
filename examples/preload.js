import BingMaps from '../src/ol/source/BingMaps.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const view = new View({
  center: [-4808600, -2620936],
  zoom: 8,
});

const map1 = new Map({
  layers: [
    new TileLayer({
      preload: Infinity,
      source: new BingMaps({
        key: 'AlEoTLTlzFB6Uf4Sy-ugXcRO21skQO7K8eObA5_L-8d20rjqZJLs2nkO1RMjGSPN',
        imagerySet: 'Aerial',
      }),
    }),
  ],
  target: 'map1',
  view: view,
});

const map2 = new Map({
  layers: [
    new TileLayer({
      preload: 0, // default value
      source: new BingMaps({
        key: 'AlEoTLTlzFB6Uf4Sy-ugXcRO21skQO7K8eObA5_L-8d20rjqZJLs2nkO1RMjGSPN',
        imagerySet: 'AerialWithLabelsOnDemand',
      }),
    }),
  ],
  target: 'map2',
  view: view,
});
