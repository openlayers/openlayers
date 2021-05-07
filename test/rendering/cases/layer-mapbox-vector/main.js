import Map from '../../../../src/ol/Map.js';
import MapboxVector from '../../../../src/ol/layer/MapboxVector.js';
import View from '../../../../src/ol/View.js';

new Map({
  layers: [
    new MapboxVector({
      styleUrl: '/data/styles/bright-v9.json',
      accessToken: 'test-token',
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 15,
  }),
});

render({
  message: 'Mapbox vector layer renders',
  tolerance: 0.025,
});
