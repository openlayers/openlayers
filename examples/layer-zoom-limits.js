import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {fromLonLat} from '../src/ol/proj.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      maxZoom: 14, // visible at zoom levels 14 and below
      source: new OSM(),
    }),
    new TileLayer({
      minZoom: 14, // visible at zoom levels above 14
      source: new TileJSON({
        url: 'https://api.maptiler.com/maps/outdoor/tiles.json?key=' + key,
        tileSize: 512,
      }),
    }),
  ],
  view: new View({
    center: fromLonLat([-112.18688965, 36.057944835]),
    zoom: 15,
    maxZoom: 18,
    constrainOnlyCenter: true,
  }),
});
