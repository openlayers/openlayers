import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

const center = [-10997148, 4569099];

const layer = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/512x256/{z}/{x}/{y}.png',
    tileGrid: createXYZ({
      tileSize: [512, 256],
    }),
    transition: 0,
  }),
});

const map = new Map({
  target: 'map',
  pixelRatio: 1,
  view: new View({
    center: center,
    zoom: 5,
  }),
});

map.addLayer(layer);

render();
