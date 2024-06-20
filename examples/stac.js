import Map from '../src/ol/Map.js';
import STAC from '../src/ol/layer/STAC.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import proj4 from 'proj4';
import {register} from '../src/ol/proj/proj4.js';
import {transformExtent} from '../src/ol/proj.js';

register(proj4); // required to support source reprojection

const layer = new STAC({
  url: 'https://s3.us-west-2.amazonaws.com/sentinel-cogs/sentinel-s2-l2a-cogs/10/T/ES/2022/7/S2A_10TES_20220726_0_L2A/S2A_10TES_20220726_0_L2A.json',
  assets: ['visual'],
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
