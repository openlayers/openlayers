import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

const center = fromLonLat([8.6, 50.1]);

const layer1 = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
  opacity: 0.2,
});
const layer2 = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/stamen-labels/{z}/{x}/{y}.png',
    transition: 0,
  }),
});

const map = new Map({
  pixelRatio: 1,
  layers: [layer1, layer2],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
});

map.getView().setRotation(Math.PI / 2);

render();
