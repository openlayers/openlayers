import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import WebGLVectorTileLayer from '../src/ol/layer/WebGLVectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const style = [
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'landuse'],
      ['==', ['get', 'class'], 'park'],
    ],
    style: {
      'fill-color': '#d8e8c8',
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'landuse'],
      ['==', ['get', 'class'], 'cemetery'],
    ],
    style: {
      'fill-color': '#e0e4dd',
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'landuse'],
      ['==', ['get', 'class'], 'hospital'],
    ],
    style: {
      'fill-color': '#fde',
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'landuse'],
      ['==', ['get', 'class'], 'school'],
    ],
    style: {
      'fill-color': '#f0e8f8',
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'landuse'],
      ['==', ['get', 'class'], 'wood'],
    ],
    style: {
      'fill-color': 'rgb(233,238,223)',
    },
  },
  {
    filter: ['==', ['get', 'layer'], 'waterway'],
    style: {
      'stroke-color': '#a0c8f0',
      'stroke-width': 1,
    },
  },
  {
    filter: ['==', ['get', 'layer'], 'water'],
    style: {
      'fill-color': '#a0c8f0',
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'aeroway'],
      ['==', ['geometry-type'], 'Polygon'],
    ],
    style: {
      'fill-color': 'rgb(242,239,235)',
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'aeroway'],
      ['==', ['geometry-type'], 'LineString'],
      ['<=', ['resolution'], 76.43702828517625],
    ],
    style: {
      'fill-color': '#f0ede9',
    },
  },
  {
    filter: ['==', ['get', 'layer'], 'building'],
    style: {
      'fill-color': '#f2eae2',
      'stroke-color': '#dfdbd7',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      ['==', ['get', 'class'], 'motorway_link'],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      ['==', ['get', 'class'], 'service'],
    ],
    style: {
      'stroke-color': '#cfcdca',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      [
        'any',
        ['==', ['get', 'class'], 'street'],
        ['==', ['get', 'class'], 'street_limited'],
      ],
    ],
    style: {
      'stroke-color': '#cfcdca',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      ['==', ['get', 'class'], 'main'],
      ['<=', ['resolution'], 1222.99245256282],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      ['==', ['get', 'class'], 'motorway'],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      ['==', ['get', 'class'], 'path'],
    ],
    style: {
      'stroke-color': '#cba',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'tunnel'],
      ['==', ['get', 'class'], 'major_rail'],
    ],
    style: {
      'stroke-color': '#bbb',
      'stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'road'],
      ['==', ['get', 'class'], 'motorway_link'],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'road'],
      [
        'any',
        ['==', ['get', 'class'], 'street'],
        ['==', ['get', 'class'], 'street_limited'],
      ],
      ['==', ['geometry-type'], 'LineString'],
    ],
    style: {
      'stroke-color': '#cfcdca',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'road'],
      ['==', ['get', 'class'], 'main'],
      ['<=', ['resolution'], 1222.99245256282],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'road'],
      ['==', ['get', 'class'], 'motorway'],
      ['<=', ['resolution'], 4891.96981025128],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'road'],
      ['==', ['get', 'class'], 'path'],
    ],
    style: {
      'stroke-color': '#cba',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'road'],
      ['==', ['get', 'class'], 'major_rail'],
    ],
    style: {
      'stroke-color': '#bbb',
      'stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'bridge'],
      [
        'any',
        ['==', ['get', 'class'], 'motorway'],
        ['==', ['get', 'class'], 'motorway_link'],
      ],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'bridge'],
      [
        'any',
        ['==', ['get', 'class'], 'street'],
        ['==', ['get', 'class'], 'street_limited'],
        ['==', ['get', 'class'], 'service'],
      ],
    ],
    style: {
      'stroke-color': '#cfcdca',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'bridge'],
      ['==', ['get', 'class'], 'main'],
      ['<=', ['resolution'], 1222.99245256282],
    ],
    style: {
      'stroke-color': '#e9ac77',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'bridge'],
      ['==', ['get', 'class'], 'path'],
    ],
    style: {
      'stroke-color': '#cba',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'bridge'],
      ['==', ['get', 'class'], 'major_rail'],
    ],
    style: {
      'stroke-color': '#bbb',
      'stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'admin'],
      ['>=', ['get', 'admin_level'], 2],
      ['==', ['get', 'maritime'], 0],
    ],
    style: {
      'stroke-color': '#9e9cab',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'admin'],
      ['>=', ['get', 'admin_level'], 2],
      ['==', ['get', 'maritime'], 1],
    ],
    style: {
      'stroke-color': '#a0c8f0',
      'stroke-width': 1,
    },
  },
  {
    style: {'circle-radius': 4, 'circle-fill-color': '#777'},
  },
];

const map = new Map({
  layers: [
    new WebGLVectorTileLayer({
      source: new VectorTileSource({
        attributions:
          '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new MVT(),
        url:
          'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
          '{z}/{x}/{y}.vector.pbf?access_token=' +
          key,
      }),
      style,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
