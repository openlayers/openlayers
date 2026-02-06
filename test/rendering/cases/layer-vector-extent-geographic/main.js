import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

useGeographic();

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
  layers: [
    new VectorLayer({
      extent: [-50, -45, 50, 45],
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
    }),
  ],
});

render();
