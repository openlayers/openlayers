import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {Map, View} from '../src/ol/index.js';
import {applyBackground, applyStyle} from 'ol-mapbox-style';
import {createXYZ} from '../src/ol/tilegrid.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const url = 'https://api.maptiler.com/maps/basic-4326/style.json?key=' + key;

// Match the server resolutions
const tileGrid = createXYZ({
  extent: [-180, -90, 180, 90],
  tileSize: 512,
  maxResolution: 180 / 512,
  maxZoom: 13,
});

const layer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    projection: 'EPSG:4326',
    tileGrid: tileGrid,
  }),
});
applyStyle(layer, url, '', {resolutions: tileGrid.getResolutions()});
applyBackground(layer, url);

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    projection: 'EPSG:4326',
    zoom: 0,
    center: [0, 30],
  }),
});
