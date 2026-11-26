import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import DataTile from '../../../../src/ol/source/DataTile.js';

const tileSize = 256;

function createSource(red, green, blue) {
  const data = new Uint8Array(tileSize * tileSize * 4);
  for (let row = 0; row < tileSize; ++row) {
    for (let col = 0; col < tileSize; ++col) {
      const offset = (row * tileSize + col) * 4;
      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = (blue + col) % 256;
      data[offset + 3] = 128 + (row % 128);
    }
  }
  return new DataTile({
    loader: () => data,
    transition: 0,
  });
}

const layers = [
  new TileLayer({
    source: createSource(40, 40, 40),
  }),
];

const cellSize = 7.3e6;
for (let i = 0; i < 4; ++i) {
  for (let j = 0; j < 4; ++j) {
    const minX = -1.6e7 + i * cellSize + j * 4.1e5;
    const minY = -1.4e7 + j * cellSize;
    layers.push(
      new TileLayer({
        extent: [minX, minY, minX + 0.8 * cellSize, minY + 1.1 * cellSize],
        opacity: (i + j) % 2 ? 0.6 : 1,
        source: createSource(60 * i, 60 * j, 30 * (i + j)),
      }),
    );
  }
}

new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 156543.03392804097,
    rotation: Math.PI / 7,
  }),
});

render({
  message: 'WebGL tile layers are clipped to their overlapping extents',
});
