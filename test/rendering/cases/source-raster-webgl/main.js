import DataTile from '../../../../src/ol/source/DataTile.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import Map from '../../../../src/ol/Map.js';
import RasterSource from '../../../../src/ol/source/Raster.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const size = 256;

const data = new Uint8Array(size * size);
for (let row = 0; row < size; ++row) {
  for (let col = 0; col < size; ++col) {
    data[row * size + col] = (row + col) % 2 === 0 ? 255 : 0;
  }
}

const raster = new RasterSource({
  sources: [
    new TileLayer({
      source: new DataTile({
        maxZoom: 0,
        interpolate: true,
        loader: () => data,
      }),
    }),
  ],
  threads: 0, // Avoid using workers to work with puppeteer
  operation: function (pixels) {
    const pixel = pixels[0];
    pixel[3] = pixel[0] < 144 ? 0 : 255;
    return pixel;
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
