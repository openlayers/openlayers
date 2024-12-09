import {MapboxVectorLayer} from 'ol-mapbox-style';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';

const mapboxVectorLayer = new MapboxVectorLayer({
  styleUrl: '/data/styles/bright-v9/style.json',
});

new Map({
  layers: [mapboxVectorLayer],
  target: 'map',
  view: new View({
    center: [1822585.77586262, 6141438.140891937],
    zoom: 16,
  }),
});

render({
  message: 'Vector tile layer declutters image with text correctly',
  tolerance: 0.01,
});
