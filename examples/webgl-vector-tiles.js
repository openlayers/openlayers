import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import WebGLVectorTileLayer from '../src/ol/layer/WebGLVectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

// const layerFilter = [
//   '!',
//   [
//     'in',
//     ['get', 'layer'],
// //     ['literal', ['place_label', 'country_label', 'poi_label']],
//   ],
// ];

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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
    style: {
      'fill-color': 'rgb(233,238,223)',
    },
  },
  {
    filter: ['==', ['get', 'layer'], 'waterway'],
    else: true,
    style: {
      'stroke-color': '#a0c8f0',
      'stroke-width': 1,
    },
  },
  {
    filter: ['==', ['get', 'layer'], 'water'],
    else: true,
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
    else: true,
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
    else: true,
    style: {
      'fill-color': '#f0ede9',
    },
  },
  {
    filter: ['==', ['get', 'layer'], 'building'],
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
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
    else: true,
    style: {
      'stroke-color': '#a0c8f0',
      'stroke-width': 1,
    },
  },
  {
    filter: [
      'any',
      ['==', ['get', 'layer'], 'country_label'],
      ['==', ['get', 'layer'], 'place_label'],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'bold 11px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#334',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'country_label'],
      ['==', ['get', 'scalerank'], 2],
      ['<=', ['resolution'], 19567.87924100512],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'bold 10px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#334',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'country_label'],
      ['==', ['get', 'scalerank'], 3],
      ['<=', ['resolution'], 9783.93962050256],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'bold 9px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#334',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'country_label'],
      ['==', ['get', 'scalerank'], 4],
      ['<=', ['resolution'], 4891.96981025128],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'bold 8px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#334',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 2,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'marine_label'],
      ['==', ['get', 'labelrank'], 1],
      ['==', ['geometry-type'], 'Point'],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'italic 11px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#74aee9',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'marine_label'],
      ['==', ['get', 'labelrank'], 2],
      ['==', ['geometry-type'], 'Point'],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'italic 11px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#74aee9',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'marine_label'],
      ['==', ['get', 'labelrank'], 3],
      ['==', ['geometry-type'], 'Point'],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'italic 10px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#74aee9',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'marine_label'],
      ['==', ['get', 'labelrank'], 4],
      ['==', ['geometry-type'], 'Point'],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'italic 9px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#74aee9',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'place_label'],
      ['==', ['get', 'type'], 'city'],
      ['<=', ['resolution'], 1222.99245256282],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': '11px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#333',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'place_label'],
      ['==', ['get', 'type'], 'town'],
      ['<=', ['resolution'], 305.748113140705],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': '9px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#333',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'place_label'],
      ['==', ['get', 'type'], 'village'],
      ['<=', ['resolution'], 38.21851414258813],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': '8px "Open Sans", "Arial Unicode MS", sans-serif',
      'text-fill-color': '#333',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
  },
  {
    filter: [
      'all',
      ['==', ['get', 'layer'], 'place_label'],
      ['<=', ['resolution'], 19.109257071294063],
      [
        'any',
        ['==', ['get', 'type'], 'hamlet'],
        ['==', ['get', 'type'], 'suburb'],
        ['==', ['get', 'type'], 'neighbourhood'],
      ],
    ],
    else: true,
    style: {
      'text-value': ['get', 'name_en'],
      'text-font': 'bold 9px "Arial Narrow"',
      'text-fill-color': '#633',
      'text-stroke-color': 'rgba(255,255,255,0.8)',
      'text-stroke-width': 1,
    },
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
      // style: {
      //   'stroke-width': 3,
      //   'fill-color': 'rgba(0, 0, 255, 0.1)',
      // },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    multiWorld: true,
  }),
});
