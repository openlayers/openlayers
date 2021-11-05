import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

const center = fromLonLat([-80.4, 32.49]);

const layer1 = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/south-carolina/{z}/{x}/1-{y}.png',
    transition: 0,
  }),
});
const layer2 = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/south-carolina/{z}/{x}/2-{y}.png',
    transition: 0,
  }),
  opacity: 0.5,
});
const layer3 = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/south-carolina/{z}/{x}/3-{y}.png',
    transition: 0,
  }),
  opacity: 0.5,
});
const layer4 = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/south-carolina/{z}/{x}/4-{y}.png',
    transition: 0,
  }),
  opacity: 0.5,
});

new Map({
  pixelRatio: 1,
  layers: [layer1, layer2, layer3, layer4],
  target: 'map',
  view: new View({
    center: center,
    zoom: 11.4,
  }),
});

render();
