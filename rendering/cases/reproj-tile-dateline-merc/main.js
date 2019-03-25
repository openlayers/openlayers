import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import XYZ from '../../../src/ol/source/XYZ.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import {get, transform} from '../../../src/ol/proj.js';
import {register} from '../../../src/ol/proj/proj4.js';
import proj4 from 'proj4';

proj4.defs('merc_180', '+proj=merc +lon_0=180 +units=m +no_defs');

register(proj4);
const merc = get('merc_180');
merc.setExtent([-20026376.39, -20048966.10, 20026376.39, 20048966.10]);

const center4326 = [180, 0];
const center = transform(center4326, 'EPSG:4326', 'merc_180');

const source = new XYZ({
  projection: 'EPSG:4326',
  minZoom: 0,
  maxZoom: 0,
  url: '/data/tiles/4326/{z}/{x}/{y}.png'
});

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new TileLayer({
      source: source
    })
  ],
  view: new View({
    projection: 'merc_180',
    center: center,
    zoom: 0
  })
});

render();
