import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import WMTS from '../src/ol/source/WMTS.js';
import WMTSTileGrid from '../src/ol/tilegrid/WMTS.js';
import {get as getProjection} from '../src/ol/proj.js';
import {getTopLeft, getWidth} from '../src/ol/extent.js';

// create the WMTS tile grid in the google projection
const projection = getProjection('EPSG:3857');
const tileSizePixels = 256;
const tileSizeMtrs = getWidth(projection.getExtent()) / tileSizePixels;
const matrixIds = [];
const resolutions = [];
for (let i = 0; i <= 14; i++) {
  matrixIds[i] = i;
  resolutions[i] = tileSizeMtrs / Math.pow(2, i);
}
const tileGrid = new WMTSTileGrid({
  origin: getTopLeft(projection.getExtent()),
  resolutions: resolutions,
  matrixIds: matrixIds,
});

const scalgoToken = 'CC5BF28A7D96B320C7DFBFD1236B5BEB';

const wmtsSource = new WMTS({
  url: 'https://ts2.scalgo.com/olpatch/wmts?token=' + scalgoToken,
  layer: 'SRTM_4_1:SRTM_4_1_flooded_sealevels',
  format: 'image/png',
  matrixSet: 'EPSG:3857',
  attributions: [
    '<a href="https://scalgo.com" target="_blank">SCALGO</a>',
    '<a href="https://cgiarcsi.community/data/' +
      'srtm-90m-digital-elevation-database-v4-1"' +
      ' target="_blank">CGIAR-CSI SRTM</a>',
  ],
  tileGrid: tileGrid,
  style: 'default',
  dimensions: {
    'threshold': 100,
  },
});

const map = new Map({
  target: 'map',
  view: new View({
    projection: projection,
    center: [-9871995, 3566245],
    zoom: 6,
  }),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new TileLayer({
      opacity: 0.5,
      source: wmtsSource,
    }),
  ],
});

const slider = document.getElementById('slider');
const updateSourceDimension = function () {
  wmtsSource.updateDimensions({'threshold': slider.value});
  document.getElementById('theinfo').innerHTML = slider.value + ' meters';
};
slider.addEventListener('input', updateSourceDimension);
updateSourceDimension();
