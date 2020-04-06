import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileWMS from '../src/ol/source/TileWMS.js';
import View from '../src/ol/View.js';
import {get as getProjection} from '../src/ol/proj.js';
import {getWidth} from '../src/ol/extent.js';

const projExtent = getProjection('EPSG:3857').getExtent();
const startResolution = getWidth(projExtent) / 256;
const resolutions = new Array(22);
for (let i = 0, ii = resolutions.length; i < ii; ++i) {
  resolutions[i] = startResolution / Math.pow(2, i);
}
const tileGrid = new TileGrid({
  extent: [-13884991, 2870341, -7455066, 6338219],
  resolutions: resolutions,
  tileSize: [512, 256],
});

const layers = [
  new TileLayer({
    source: new OSM(),
  }),
  new TileLayer({
    source: new TileWMS({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver',
      tileGrid: tileGrid,
    }),
  }),
];
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
  }),
});
