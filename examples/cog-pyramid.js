import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import LayerGroup from '../src/ol/layer/Group.js';
import Map from '../src/ol/Map.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';
import View from '../src/ol/View.js';
import WebGLTileLayer from '../src/ol/layer/WebGLTile.js';
import {getIntersection} from '../src/ol/extent.js';

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

const pyramid = new LayerGroup();
const layerForUrl = {};
const zs = tileGrid.getResolutions().length;

function useLayer(z, x, y) {
  const url = `https://s2downloads.eox.at/demo/EOxCloudless/2019/rgb/${z}/${y}/${x}.tif`;
  if (!(url in layerForUrl)) {
    pyramid.getLayers().push(
      new WebGLTileLayer({
        minZoom: z,
        maxZoom: z === 0 || z === zs - 1 ? undefined : z + 1,
        extent: tileGrid.getTileCoordExtent([z, x, y]),
        source: new GeoTIFF({
          sources: [
            {
              url: url,
            },
          ],
        }),
      })
    );
    layerForUrl[url] = true;
  }
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

// Add overview layer
useLayer(0, 0, 0);

// Add layer for specific extent on demand
map.on('moveend', () => {
  const view = map.getView();
  tileGrid.forEachTileCoord(
    getIntersection([-180, -90, 180, 90], view.calculateExtent()),
    tileGrid.getZForResolution(view.getResolution()),
    ([z, x, y]) => useLayer(z, x, y)
  );
});
