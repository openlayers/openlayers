/**
 * Tile layers get clipped to their extent.
 */

import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import XYZ from '../../../src/ol/source/XYZ.js';
import {useGeographic} from '../../../src/ol/proj.js';

useGeographic();

const center = [7, 50];
const extent = [2, 47, 10, 53];

new Map({
  target: 'map',
  view: new View({
    center: center,
    zoom: 3
  }),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        maxZoom: 3
      }),
      extent: extent
    }),
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/stamen-labels/{z}/{x}/{y}.png',
        minZoom: 3,
        maxZoom: 5
      }),
      extent: extent
    })
  ]
});

render();
