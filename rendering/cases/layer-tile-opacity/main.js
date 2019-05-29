import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import {fromLonLat} from '../../../src/ol/proj.js';
import XYZ from '../../../src/ol/source/XYZ.js';

const center = fromLonLat([8.6, 50.1]);

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0
      }),
      opacity: 0.2
    })
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3
  })
});

render();
