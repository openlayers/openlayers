import Map from '../../../../src/ol/Map.js';
import MapboxVector from '../../../../src/ol/layer/MapboxVector.js';
import View from '../../../../src/ol/View.js';

const mapboxVectorLayer = new MapboxVector({
  styleUrl: '/data/styles/bright-v9/style.json',
  accessToken: 'test-token',
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
