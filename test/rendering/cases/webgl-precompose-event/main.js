import DataTileSource from '../../../../src/ol/source/DataTile.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const high = new Uint8Array(256 * 256).fill(255);
const low = new Uint8Array(256 * 256).fill(0);

const red = new TileLayer({
  transition: 0,
  source: new DataTileSource({
    minZoom: 2,
    loader: function (z, x, y) {
      if ((x + y) % 2 === 0) {
        return high;
      }
      return low;
    },
  }),
  style: {
    color: ['array', ['band', 1], 0, 0, 1],
  },
});

const green = new TileLayer({
  transition: 0,
  source: new DataTileSource({
    minZoom: 2,
    loader: (z, x) => {
      if (x % 2 === 0) {
        return high;
      }
      return low;
    },
  }),
  style: {
    color: ['array', 0, ['band', 1], 0, 1],
  },
});

green.on('precompose', (event) => {
  const gl = event.context;
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.ONE, gl.ONE);
});

const blue = new TileLayer({
  transition: 0,
  source: new DataTileSource({
    minZoom: 2,
    loader: (z, x, y) => {
      if (y % 2 === 0) {
        return high;
      }
      return low;
    },
  }),
  style: {
    color: ['array', 0, 0, ['band', 1], 1],
  },
});

blue.on('precompose', (event) => {
  const gl = event.context;
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.ONE, gl.ONE);
});

new Map({
  target: 'map',
  layers: [red, green, blue],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

render({
  message: 'precompose events can be used to change layer blending',
});
