import Map from '../src/ol/Map.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new TileJSON({
        url: 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json?secure=1',
        crossOrigin: 'anonymous',
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
