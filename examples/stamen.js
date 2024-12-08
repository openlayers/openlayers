import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';

const map = new Map({
  layers: [
    // NOTE: Layers from Stadia Maps do not require an API key for localhost development or most production
    // web deployments. See https://docs.stadiamaps.com/authentication/ for details.
    new TileLayer({
      source: new StadiaMaps({
        layer: 'stamen_watercolor',
        // apiKey: 'OPTIONAL'
      }),
    }),
    new TileLayer({
      source: new StadiaMaps({
        layer: 'stamen_terrain_labels',
        // apiKey: 'OPTIONAL'
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-122.416667, 37.783333]),
    zoom: 12,
  }),
});
