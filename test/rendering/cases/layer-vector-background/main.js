import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Map from '../../../../src/ol/Map.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
  layers: [
    new VectorLayer({
      background: '#a9d3df',
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
      style: {
        'stroke-color': '#ccc',
        'fill-color': 'white',
      },
    }),
  ],
});

render();
