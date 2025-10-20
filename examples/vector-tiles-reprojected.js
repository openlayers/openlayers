import {applyBackground, applyStyle} from 'ol-mapbox-style';
import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import {register} from '../src/ol/proj/proj4.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {createXYZ} from '../src/ol/tilegrid.js';

// Register proj4 definition for North Pole Lambert Azimuthal Equal Area
proj4.defs(
  'ESRI:102017',
  '+proj=laea +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs',
);
register(proj4);

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const url = 'https://api.maptiler.com/maps/basic-4326/style.json?key=' + key;

const layer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    projection: 'EPSG:4326',
    // Match the server resolutions
    tileGrid: createXYZ({
      extent: [-180, -90, 180, 90],
      tileSize: 512,
      maxResolution: 180 / 512,
      maxZoom: 13,
    }),
  }),
});
applyStyle(layer, url);
applyBackground(layer, url);

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    projection: 'ESRI:102017',
    minZoom: 3,
    zoom: 4,
    center: fromLonLat([0, 90], 'ESRI:102017'),
  }),
});
