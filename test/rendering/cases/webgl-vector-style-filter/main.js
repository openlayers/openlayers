import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../../../../src/ol/layer/WebGLVector.js';
import {fromLonLat} from '../../../../src/ol/proj.js';
import OSM from '../../../../src/ol/source/OSM.js';
import Source from '../../../../src/ol/source/Vector.js';

const format = new GeoJSON();
const features = format.readFeatures({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1,
      properties: {
        classLabel: 'One',
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-20, 20]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Two',
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-15, 15]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Three',
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-10, 10]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Four',
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-5, 5]),
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-1, 1]),
      },
    },
    {
      type: 'Feature',
      properties: {
        flags: {
          extraLabel: 'center',
        },
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([0, 0]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classType: 1,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([20, 20]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classType: 2,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([15, 15]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classType: 3,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([10, 10]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classType: 4,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([5, 5]),
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([1, 1]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'One',
        classType: 1,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-20, -20]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Two',
        classType: 2,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-15, -15]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Three',
        classType: 3,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-10, -10]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Four',
        classType: 4,
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-5, -5]),
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-1, -1]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'One',
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([20, -20]),
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([15, -15]),
      },
    },
    {
      type: 'Feature',
      properties: {
        classLabel: 'Three',
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([10, -10]),
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([5, -5]),
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([1, -1]),
      },
    },
    {
      type: 'Feature',
      properties: {
        flags: {
          something: 'this is not visible!',
        },
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([30, 30]),
      },
    },
    {
      type: 'Feature',
      properties: {
        flags: {
          extraLabel: 'outside',
        },
      },
      geometry: {
        type: 'Point',
        coordinates: fromLonLat([-30, -30]),
      },
    },
  ],
});

new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new WebGLVectorLayer({
      source: new Source({features}),
      style: [
        {
          filter: ['any', ['has', 'classLabel'], ['has', 'classType']],
          style: {
            'circle-radius': 4.5,
            'circle-fill-color': [
              'match',
              ['get', 'classType'],
              1,
              'red',
              2,
              'blue',
              3,
              'yellow',
              4,
              'green',
              '#867f7f', // Default
            ],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'text-value': ['coalesce', ['get', 'classLabel'], '?'],
            'text-font':
              'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
            'text-fill-color': '#333',
            'text-stroke-color': 'rgba(255,255,255,0.8)',
            'text-stroke-width': 2,
            'text-offset-y': -15,
          },
        },
        {
          else: true,
          filter: ['has', 'flags', 'extraLabel'],
          style: {
            'circle-radius': 3,
            'circle-stroke-color': '#131313',
            'circle-stroke-width': 1,
            'text-value': ['get', 'flags', 'extraLabel'],
            'text-font':
              'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
            'text-fill-color': '#333',
            'text-stroke-color': 'rgba(255,255,255,0.8)',
            'text-stroke-width': 2,
            'text-offset-y': -15,
          },
        },
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2.5,
  }),
});

render();
