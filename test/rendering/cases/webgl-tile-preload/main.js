import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import TileDebug from '../../../../src/ol/source/TileDebug.js';

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new TileDebug(),
      preload: Infinity,
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0.5,
  }),
});

render();
