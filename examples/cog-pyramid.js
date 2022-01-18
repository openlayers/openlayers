import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';
import View from '../src/ol/View.js';
import WebGLTileLayer from '../src/ol/layer/WebGLTile.js';
import {sourcesFromTileGrid} from '../src/ol/source.js';

// Metadata from https://s2downloads.eox.at/demo/EOxCloudless/2019/rgb/2019_EOxCloudless_rgb.json

// Tile grid of the GeoTIFF pyramid layout
const tileGrid = new TileGrid({
  extent: [-180, -90, 180, 90],
  resolutions: [0.703125, 0.3515625, 0.17578125, 8.7890625e-2, 4.39453125e-2],
  tileSizes: [
    [512, 256],
    [1024, 512],
    [2048, 1024],
    [4096, 2048],
    [4096, 4096],
  ],
});

const pyramid = new WebGLTileLayer({
  sources: sourcesFromTileGrid(
    tileGrid,
    ([z, x, y]) =>
      new GeoTIFF({
        sources: [
          {
            url: `https://s2downloads.eox.at/demo/EOxCloudless/2019/rgb/${z}/${y}/${x}.tif`,
          },
        ],
      })
  ),
});

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
