import {applyBackground, applyStyle} from 'ol-mapbox-style';
import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import {register} from '../src/ol/proj/proj4.js';
import {get as getProjection} from '../src/ol/proj.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {createXYZ} from '../src/ol/tilegrid.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const url = 'https://api.maptiler.com/maps/basic-4326/style.json?key=' + key;

// Equal Earth projection with dynamic center meridian
function dynEqualEarth(center, round = 15) {
  const lon0 = Math.round(center[0] / round) * round;
  const code = `EqualEarth${lon0}`;
  let prj = getProjection(code);
  if (!prj) {
    proj4.defs(
      code,
      `+proj=eqearth +lon_0=${lon0} +x_0=0 +y_0=0 +R=6371008.7714 +units=m +no_defs +type=crs`,
    );
    register(proj4);
    prj = getProjection(code);
    prj.setGlobal(true);
    prj.setExtent([-17243959.06, -8392927.6, 17243959.06, 8392927.6]);
    prj.setWorldExtent([-180, -90, 180, 90]);
  }

  return prj;
}

const projection = dynEqualEarth([0, 0]);

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
    wrapX: false,
  }),
});
applyStyle(layer, url, {resolutions: tileGrid.getResolutions()});
applyBackground(layer, url);

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    projection,
    zoom: 0,
    center: [0, 0],
    showFullExtent: true,
  }),
});
