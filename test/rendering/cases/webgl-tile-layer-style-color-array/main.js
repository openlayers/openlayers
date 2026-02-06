import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
      style: {
        color: ['array', 0.25, ['band', 2], ['band', 3], 0.5],
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [15700000, 2700000],
    zoom: 2,
  }),
});

render();
