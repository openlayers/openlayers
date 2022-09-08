import Map from '../src/ol/Map.js';
import STAC from '../src/ol/layer/STAC.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import proj4 from 'proj4';
import {register} from '../src/ol/proj/proj4.js';
import {transformExtent} from '../src/ol/proj.js';

register(proj4); // required to support source reprojection

/**
 * Get a Shared Access Signature Token to authorize asset requests.
 * See https://planetarycomputer.microsoft.com/docs/concepts/sas/
 * @param {string} href The unsigned URL.
 * @return {Promise<string>} A promise for the signed URL.
 */
async function sign(href) {
  const params = new URLSearchParams({href});
  const response = await fetch(
    `https://planetarycomputer.microsoft.com/api/sas/v1/sign?${params}`
  );
  const body = await response.json();
  return body.href;
}

const layer = new STAC({
  url: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items/S2B_MSIL2A_20220909T185929_R013_T10TES_20220910T222807',
  assets: ['visual'],
  async getSourceOptions(item, options) {
    for (const source of options.sources) {
      source.url = await sign(source.url);
    }
    return options;
  },
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const background = new TileLayer({
  visible: false,
  source: new XYZ({
    url: 'https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=' + key,
    tileSize: 512,
  }),
});

const map = new Map({
  target: 'map',
  layers: [background, layer],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

layer.on('sourceready', () => {
  const item = layer.getItem();
  const view = map.getView();
  view.fit(transformExtent(item.bbox, 'EPSG:4326', view.getProjection()));
  background.setVisible(true);
});
