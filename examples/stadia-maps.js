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
        layer: 'alidade_smooth_dark',
        retina: true,
        // apiKey: 'OPTIONAL'
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([24.750645, 59.444351]),
    zoom: 14,
  }),
});
