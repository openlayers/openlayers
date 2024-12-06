import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import Layer from '../../../../src/ol/layer/Vector.js';
import Source from '../../../../src/ol/source/Vector.js';

const format = new GeoJSON();
const features = format.readFeatures({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'null-island',
      geometry: {
        type: 'Point',
        coordinates: [0, 0],
      },
      properties: {},
    },
  ],
});

new Map({
  layers: [
    new Layer({
      source: new Source({features}),
      style: {
        'circle-radius': 60,
        'circle-fill-color': 'orange',
        'circle-stroke-color': 'red',
        'circle-stroke-width': 10,
        'text-fill-color': 'white',
        'text-stroke-color': 'red',
        'text-stroke-width': 8,
        'text-font': 'bold 40px sans-serif',
        'text-value': ['id'],
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render();
