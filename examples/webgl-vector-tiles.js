import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MVT from '../src/ol/format/MVT.js';
import WebGLVectorTileLayer from '../src/ol/layer/WebGLVectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

// create pattern
const canvasFill = document.createElement('canvas');
canvasFill.width = 16;
canvasFill.height = 16;
const context = canvasFill.getContext('2d');
context.fillStyle = 'rgba(255, 0, 0, 0.5)';
context.fillRect(0, 0, 8, 8);
context.fillStyle = 'rgba(94, 255, 0, 0.5)';
context.fillRect(8, 0, 8, 8);
context.fillStyle = 'rgba(255, 213, 0, 0.5)';
context.fillRect(8, 8, 8, 8);
context.fillStyle = 'rgba(255,255,255,0.5)';
context.fillRect(0, 8, 8, 8);

/** @type {import('../src/ol/style/flat.js').FlatStyleLike} */
const style = [
  {
    else: true,
    style: {
      'stroke-color': ['*', ['get', 'COLOR'], [220, 220, 220]],
      'stroke-width': 2,
      'stroke-offset': -1,
      'fill-pattern-src': canvasFill.toDataURL('png'),
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
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
