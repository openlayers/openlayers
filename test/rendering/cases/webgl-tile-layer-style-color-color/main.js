import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
      }),
      style: {
        color: [
          'color',
          64,
          ['*', ['band', 2], 255],
          ['*', ['band', 3], 255],
          0.5,
        ],
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
