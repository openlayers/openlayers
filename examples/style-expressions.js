import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Vector.js';
import Source from '../src/ol/source/Vector.js';

const format = new GeoJSON();

const map = new Map({
  layers: [
    new Layer({
      background: '#1a2b39',
      source: new Source({
        url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson',
        format,
      }),
      style: {
        'fill-color': 'darkgray',
      },
    }),
    new Layer({
      source: new Source({
        url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_populated_places_simple.geojson',
        format,
      }),
      style: {
        'circle-radius': ['get', 'scalerank'],
        'circle-fill-color': 'gray',
        'circle-stroke-color': 'white',
        'circle-stroke-width': 0.5,
      },
    }),
    new Layer({
      source: new Source({
        url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_populated_places_simple.geojson',
        format,
      }),
      declutter: true,
      style: [
        {
          filter: ['>', ['get', 'pop_max'], 10_000_000],
          style: {
            'text-value': [
              'concat',
              ['get', 'adm1name'],
              ', ',
              ['get', 'adm0name'],
            ],
            'text-font': '16px sans-serif',
            'text-fill-color': 'white',
            'text-stroke-color': 'gray',
            'text-stroke-width': 2,
          },
        },
        {
          else: true,
          filter: ['>', ['get', 'pop_max'], 5_000_000],
          style: {
            'text-value': ['get', 'nameascii'],
            'text-font': '12px sans-serif',
            'text-fill-color': 'white',
            'text-stroke-color': 'gray',
            'text-stroke-width': 2,
          },
        },
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
