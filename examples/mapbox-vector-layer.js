import Map from '../src/ol/Map.js';
import MapboxVector from '../src/ol/layer/MapboxVector.js';
import View from '../src/ol/View.js';

const map = new Map({
  target: 'map',
  layers: [
    new MapboxVector({
      styleUrl: 'mapbox://styles/mapbox/bright-v9',
      accessToken:
        'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ',
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
