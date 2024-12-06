import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/WebGLTile.js';
import Source from '../src/ol/source/ImageTile.js';

const map = new Map({
  target: 'map',
  layers: [
    new Layer({
      source: new Source({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attributions:
          '&#169; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.',
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});
