import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Map from '../../../../src/ol/Map.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {transformExtent} from '../../../../src/ol/proj.js';

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
    rotation: Math.PI / 4,
  }),
  layers: [
    new VectorLayer({
      extent: transformExtent([-50, -45, 50, 45], 'EPSG:4326', 'EPSG:3857'),
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
    }),
  ],
});

render();
