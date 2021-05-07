import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import proj4 from 'proj4';
import {get, transform} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';

proj4.defs(
  'EPSG:3413',
  '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 ' +
    '+k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
);

register(proj4);
const proj3413 = get('EPSG:3413');
proj3413.setExtent([-4194304, -4194304, 4194304, 4194304]);

const center4326 = [0, 90];
const center = transform(center4326, 'EPSG:4326', 'EPSG:3413');

const source = new XYZ({
  maxZoom: 0,
  projection: 'EPSG:4326',
  url: '/data/tiles/4326/{z}/{x}/{y}.png',
});

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  view: new View({
    projection: 'EPSG:3413',
    center: center,
    zoom: 0,
  }),
});

render();
