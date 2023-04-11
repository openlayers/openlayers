import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import View from '../../../../src/ol/View.js';
import {Vector as VectorLayer} from '../../../../src/ol/layer.js';
import {Vector as VectorSource} from '../../../../src/ol/source.js';

const center = [0, 0];

new Map({
  pixelRatio: 2,
  layers: [
    new VectorLayer({
      style: {
        'icon-src': '/data/sprites/gis_symbols.png',
        'icon-color': [255, 0, 0, 1],
        'icon-offset': [32, 0],
        'icon-size': [32, 32],
      },
      source: new VectorSource({
        features: [new Feature(new Point(center))],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 2,
  }),
});

render();
