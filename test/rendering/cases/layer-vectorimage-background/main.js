import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Map from '../../../../src/ol/Map.js';
import VectorImageLayer from '../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Fill, Stroke, Style} from '../../../../src/ol/style.js';

new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
  layers: [
    new VectorImageLayer({
      background: '#a9d3df',
      source: new VectorSource({
        url: '/data/countries.json',
        format: new GeoJSON(),
      }),
      style: new Style({
        stroke: new Stroke({
          color: '#ccc',
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    }),
  ],
});

render();
