import DataTile from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const size = 260;

const data = new Uint8Array(size * size);
for (let row = 0; row < size; ++row) {
  for (let col = 0; col < size; ++col) {
    data[row * size + col] = (row + col) % 2 === 0 ? 255 : 0;
  }
}

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new DataTile({
        transition: 0,
        maxZoom: 1,
        interpolate: true,
        loader: () => data,
        gutter: 2,
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 5,
  }),
});

render();
