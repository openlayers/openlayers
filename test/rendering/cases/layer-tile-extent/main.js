/**
 * Tile layers get clipped to their extent.
 */

import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {fromLonLat, transformExtent} from '../../../../src/ol/proj.js';

const center = fromLonLat([7, 50]);
const extent = transformExtent([2, 47, 10, 53], 'EPSG:4326', 'EPSG:3857');

new Map({
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        maxZoom: 3,
      }),
      extent: extent,
    }),
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/stamen-labels/{z}/{x}/{y}.png',
        minZoom: 3,
        maxZoom: 5,
      }),
      extent: extent,
    }),
  ],
});

render();
