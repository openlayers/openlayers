import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import DataTile from '../../../../src/ol/source/DataTile.js';

const tileSize = 256;

function createSource(red, green, blue) {
  const data = new Uint8Array(tileSize * tileSize * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = red;
    data[i + 1] = green;
    data[i + 2] = blue;
    data[i + 3] = 255;
  }
  return new DataTile({
    loader: () => data,
    transition: 0,
  });
}

const clipped = new TileLayer({
  extent: [-1.5e7, -1.5e7, 1e7, 1e7],
  source: createSource(200, 40, 40),
});
clipped.on('prerender', (event) => {
  const gl = event.context;
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, 0, gl.drawingBufferWidth / 2, gl.drawingBufferHeight);
});
clipped.on('postrender', (event) => {
  const gl = event.context;
  gl.disable(gl.SCISSOR_TEST);
});

new Map({
  layers: [
    new TileLayer({
      source: createSource(40, 40, 40),
    }),
    clipped,
    new TileLayer({
      extent: [-5e6, -1e7, 1.5e7, 5e6],
      opacity: 0.5,
      source: createSource(40, 40, 200),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 156543.03392804097,
  }),
});

render({
  message: 'a scissor set in a prerender listener still limits a layer',
});
