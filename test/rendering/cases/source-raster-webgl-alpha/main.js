import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import DataTile from '../../../../src/ol/source/DataTile.js';
import RasterSource from '../../../../src/ol/source/Raster.js';

const size = 256;
const data0 = new Uint8Array(size * size * 4);
const data1 = new Uint8Array(size * size * 4);
const data2 = new Uint8Array(size * size * 4);

for (let row = 0; row < size; ++row) {
  for (let col = 0; col < size; ++col) {
    data0[(row * size + col) * 4 + 3] = (row + col) % 3 === 0 ? 255 : 0;
    data1[(row * size + col) * 4 + 3] = (row + col) % 3 === 1 ? 255 : 0;
    data2[(row * size + col) * 4 + 3] = (row + col) % 3 === 2 ? 255 : 0;
  }
}

const raster = new RasterSource({
  sources: [
    new TileLayer({
      source: new DataTile({
        maxZoom: 0,
        loader: () => data0,
        transition: 0,
      }),
    }),
    new TileLayer({
      source: new DataTile({
        maxZoom: 0,
        loader: () => data1,
        transition: 0,
      }),
    }),
    new TileLayer({
      source: new DataTile({
        maxZoom: 0,
        loader: () => data2,
        transition: 0,
      }),
    }),
  ],
  resolutions: null,
  threads: 0, // Avoid using workers to work with puppeteer
  operation: function (pixels) {
    return [pixels[0][3], pixels[1][3], pixels[2][3], 255];
  },
});

const map = new Map({
  target: 'map',
  layers: [new ImageLayer({source: raster})],
  view: new View({
    center: [0, 0],
    zoom: 4,
  }),
});
map.renderSync();

render();
