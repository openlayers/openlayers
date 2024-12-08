import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TopoJSON from '../src/ol/format/TopoJSON.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const key = 'uZNs91nMR-muUTP99MyBSg';

const rules = [
  {
    filter: ['==', ['get', 'layer'], 'water'],
    style: {
      'fill-color': '#9db9e8',
    },
  },
  {
    else: true,
    filter: ['all', ['==', ['get', 'layer'], 'roads'], ['get', 'railway']],
    style: {
      'stroke-color': '#7de',
      'stroke-width': 1,
      'z-index': ['number', ['get', 'sort_key'], 0],
    },
  },
  {
    else: true,
    filter: ['==', ['get', 'layer'], 'roads'],
    style: {
      'stroke-color': [
        'match',
        ['get', 'kind'],
        'major_road',
        '#776',
        'minor_road',
        '#ccb',
        'highway',
        '#f39',
        'none',
      ],
      'stroke-width': ['match', ['get', 'kind'], 'highway', 1.5, 1],
      'z-index': ['number', ['get', 'sort_key'], 0],
    },
  },
  {
    else: true,
    filter: [
      'all',
      ['==', ['get', 'layer'], 'buildings'],
      ['<', ['resolution'], 10],
    ],
    style: {
      'fill-color': '#6666',
      'stroke-color': '#4446',
      'stroke-width': 1,
      'z-index': ['number', ['get', 'sort_key'], 0],
    },
  },
];

const map = new Map({
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        attributions:
          '&copy; OpenStreetMap contributors, Who’s On First, ' +
          'Natural Earth, and osmdata.openstreetmap.de',
        format: new TopoJSON({
          layerName: 'layer',
          layers: ['water', 'roads', 'buildings'],
        }),
        maxZoom: 16,
        url:
          'https://tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=' +
          key,
      }),
      style: rules,
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-74.0064, 40.7142]),
    maxZoom: 19,
    zoom: 15,
  }),
});
