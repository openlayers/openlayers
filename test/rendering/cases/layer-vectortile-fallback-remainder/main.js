import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import TileState from '../../../../src/ol/TileState.js';
import View from '../../../../src/ol/View.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

// Vector tile version of the fallback clipping test: a target zoom (z) is
// rendered over a lower zoom (z - 1) fallback. Three of the four target tiles
// sharing one lower-zoom parent fail to load, so the parent shows through as a
// fallback, clipped to the uncovered L-shaped remainder without blending the
// translucent fill twice.

const tileSize = 64;
const targetZoom = 4;
const view = new View({center: [0, 0], zoom: targetZoom - 1});

const tileGrid = createXYZ({tileSize: tileSize});
const targetZ = tileGrid.getZForResolution(
  view.getResolutionForZoom(targetZoom),
);
const c = 1 << (targetZ - 1);
const holes = new Set([`${c}/${c}`, `${c + 1}/${c}`, `${c}/${c + 1}`]);

const source = new VectorTileSource({
  tileGrid: tileGrid,
  transition: 0,
  tileUrlFunction: (tileCoord) => tileCoord.join('/'),
  tileLoadFunction(tile, url) {
    const [z, x, y] = url.split('/').map(Number);
    if (z === targetZ && holes.has(`${x}/${y}`)) {
      tile.setState(TileState.ERROR);
      return;
    }
    const extent = tileGrid.getTileCoordExtent([z, x, y]);
    tile.setFeatures([new Feature({geometry: fromExtent(extent), z: z})]);
  },
});

const red = new Style({fill: new Fill({color: 'rgba(255, 0, 0, 0.5)'})});
const blue = new Style({fill: new Fill({color: 'rgba(0, 0, 255, 0.5)'})});

const layer = new VectorTileLayer({
  renderMode: 'vector',
  source: source,
  style: (feature) => (feature.get('z') === targetZ ? red : blue),
});

const map = new Map({target: 'map', layers: [layer], view});

map.once('rendercomplete', () => {
  view.setZoom(targetZoom);
  map.once('rendercomplete', () => {
    render({
      message: 'fallback vector tile clipped without double-blend',
      tolerance: 0.005,
    });
  });
});
