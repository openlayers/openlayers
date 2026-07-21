import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import DataTile from '../../../../src/ol/source/DataTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

// Renders a target zoom (z) over a lower zoom (z - 1) fallback. Three of the
// four target tiles that share one lower-zoom parent fail to load, so the parent
// shows through as a fallback. The renderer draws only the uncovered remainder
// of that parent (an L shape, i.e. more than one rectangle) instead of clipping
// it, which must not blend the translucent fallback under the loaded target
// tiles.

const tileSize = 64;
const targetZoom = 4;
const view = new View({center: [0, 0], zoom: targetZoom - 1});

const tileGrid = createXYZ({tileSize: tileSize});
const targetZ = tileGrid.getZForResolution(
  view.getResolutionForZoom(targetZoom),
);
const c = 1 << (targetZ - 1);
// three target tiles sharing one lower-zoom parent tile
const holes = new Set([`${c}/${c}`, `${c + 1}/${c}`, `${c}/${c + 1}`]);

function makeTile(z) {
  const canvas = document.createElement('canvas');
  canvas.width = tileSize;
  canvas.height = tileSize;
  const context = canvas.getContext('2d');
  context.fillStyle =
    z === targetZ ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
  context.fillRect(0, 0, tileSize, tileSize);
  return canvas;
}

const source = new DataTile({
  tileGrid: tileGrid,
  transition: 0,
  loader(z, x, y) {
    if (z === targetZ && holes.has(`${x}/${y}`)) {
      return Promise.reject(new Error('tile fails to load'));
    }
    return makeTile(z);
  },
});

// opacity < 1 makes the layer non-opaque, exercising the remainder path.
const layer = new TileLayer({source, opacity: 0.8});
const map = new Map({target: 'map', layers: [layer], view});

map.once('rendercomplete', () => {
  view.setZoom(targetZoom);
  map.once('rendercomplete', () => {
    render({
      message: 'Lower-zoom fallback tile fills holes without double-blending',
      tolerance: 0.005,
    });
  });
});
