import DataTile from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const size = 256;

const colors = [
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'skyblue',
];

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        loader: function () {
          const data = new Float32Array(size * size);
          const numColors = colors.length;
          const numBlocks = 8;
          const blockSize = size / numBlocks;
          for (let row = 0; row < size; ++row) {
            const r = Math.floor(row / blockSize);
            for (let col = 0; col < size; ++col) {
              const c = Math.floor(col / blockSize);
              const colorIndex = (r * numBlocks + c) % numColors;
              data[row * size + col] = colorIndex;
            }
          }
          return data;
        },
      }),
      style: {
        color: ['palette', ['band', 1], colors],
      },
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({message: 'Renders colors from a palette'});
