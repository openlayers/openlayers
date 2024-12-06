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
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, 0],
          [180, 0],
        ],
      },
      properties: {
        type: 'highway',
        lanes: 4,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, -90],
          [0, 90],
        ],
      },
      properties: {
        type: 'highway',
        lanes: 6,
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, 45],
          [180, 45],
        ],
      },
      properties: {
        type: 'dirt road',
        lanes: 1,
      },
    },
  ],
});

new Map({
  layers: [
    new Layer({
      source: new Source({features}),
      style: [
        {
          filter: ['==', ['get', 'type'], 'highway'],
          style: [
            {
              'stroke-color': 'orange',
              'stroke-width': ['*', 2, ['get', 'lanes']],
              'z-index': 1,
            },
            {
              'stroke-color': 'yellow',
              'stroke-width': ['-', ['*', 2, ['get', 'lanes']], 3],
              'z-index': 2,
            },
          ],
        },
        {
          else: true,
          style: {
            'stroke-color': 'gray',
            'stroke-width': 3,
          },
        },
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render();
