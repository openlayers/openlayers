import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import LayerGroup from '../src/ol/layer/Group.js';
import Map from '../src/ol/Map.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';
import View from '../src/ol/View.js';
import WebGLTileLayer from '../src/ol/layer/WebGLTile.js';

// Metadata from https://s2downloads.eox.at/demo/EOxCloudless/2019/rgb/2019_EOxCloudless_rgb.json

// Tile grid of the GeoTIFF pyramid layout
const tileGrid = new TileGrid({
  origin: [-180, 90],
  resolutions: [0.703125, 0.3515625, 0.17578125, 8.7890625e-2, 4.39453125e-2],
  tileSizes: [
    [512, 256],
    [1024, 512],
    [2048, 1024],
    [4096, 2048],
    [4096, 4096],
  ],
});
// Add a separate layer for each pyramid tile to a layer group
const pyramid = new LayerGroup();
const zs = tileGrid.getResolutions().length;
for (let z = 0; z < zs; ++z) {
  tileGrid.forEachTileCoord([-180, -90, 180, 90], z, ([z, x, y]) => {
    pyramid.getLayers().push(
      new WebGLTileLayer({
        minZoom: z,
        maxZoom: z === 0 || z === zs - 1 ? undefined : z + 1,
        extent: tileGrid.getTileCoordExtent([z, x, y]),
        source: new GeoTIFF({
          sources: [
            {
              url: `https://s2downloads.eox.at/demo/EOxCloudless/2019/rgb/${z}/${y}/${x}.tif`,
            },
          ],
        }),
      })
    );
  });
}

const map = new Map({
  target: 'map',
  layers: [pyramid],
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 0,
    showFullExtent: true,
  }),
});
