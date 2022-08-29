import DataTileSource from '../src/ol/source/DataTile.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import {fromLonLat} from '../src/ol/proj.js';

// 16-bit COG
// Which will be served as NumpyTiles.
const COG =
  'https://storage.googleapis.com/open-cogs/stac-examples/20201211_223832_CS2_analytic.tif';

function numpyTileLoader(z, x, y) {
  const url = `https://api.cogeo.xyz/cog/tiles/WebMercatorQuad/${z}/${x}/${y}@1x?format=npy&url=${encodeURIComponent(
    COG
  )}`;

  return fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buffer) => NumpyLoader.fromArrayBuffer(buffer))
    .then((numpyData) => {
      // flatten the numpy data
      const dataTile = new Float32Array(256 * 256 * 5);
      const bandSize = 256 * 256;
      for (let x = 0; x < 256; x++) {
        for (let y = 0; y < 256; y++) {
          const px = x + y * 256;
          dataTile[px * 5 + 0] = numpyData.data[y * 256 + x];
          dataTile[px * 5 + 1] = numpyData.data[bandSize + y * 256 + x];
          dataTile[px * 5 + 2] = numpyData.data[bandSize * 2 + y * 256 + x];
          dataTile[px * 5 + 3] = numpyData.data[bandSize * 3 + y * 256 + x];
          dataTile[px * 5 + 4] =
            numpyData.data[bandSize * 4 + y * 256 + x] > 0 ? 1.0 : 0;
        }
      }
      return dataTile;
    });
}

const interpolateBand = (bandIdx) => [
  'interpolate',
  ['linear'],
  ['band', bandIdx],
  ['var', 'bMin'],
  0,
  ['var', 'bMax'],
  1,
];

const initialMin = 3000;
const initialMax = 18000;

const numpyLayer = new TileLayer({
  style: {
    color: [
      'array',
      interpolateBand(3),
      interpolateBand(2),
      interpolateBand(1),
      ['band', 5],
    ],
    variables: {
      'bMin': initialMin,
      'bMax': initialMax,
    },
  },
  source: new DataTileSource({
    loader: numpyTileLoader,
    bandCount: 5,
  }),
});

const map = new Map({
  target: 'map',
  layers: [numpyLayer],
  view: new View({
    center: fromLonLat([172.933, 1.3567]),
    zoom: 15,
  }),
});

const inputMin = document.getElementById('input-min');
const inputMax = document.getElementById('input-max');
const outputMin = document.getElementById('output-min');
const outputMax = document.getElementById('output-max');

inputMin.addEventListener('input', (evt) => {
  numpyLayer.updateStyleVariables({
    'bMin': parseFloat(evt.target.value),
    'bMax': parseFloat(inputMax.value),
  });
  outputMin.innerText = evt.target.value;
});

inputMax.addEventListener('input', (evt) => {
  numpyLayer.updateStyleVariables({
    'bMin': parseFloat(inputMin.value),
    'bMax': parseFloat(evt.target.value),
  });
  outputMax.innerText = evt.target.value;
});

inputMin.value = initialMin;
inputMax.value = initialMax;
outputMin.innerText = initialMin;
outputMax.innerText = initialMax;
