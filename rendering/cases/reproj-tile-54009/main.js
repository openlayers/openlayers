import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import XYZ from '../../../src/ol/source/XYZ.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import {get, transform} from '../../../src/ol/proj.js';
import {register} from '../../../src/ol/proj/proj4.js';
import proj4 from 'proj4';

proj4.defs('ESRI:54009', '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

register(proj4);
const proj54009 = get('ESRI:54009');
proj54009.setExtent([-18e6, -9e6, 18e6, 9e6]);

const center4326 = [-118.125, 31.95];
const center = transform(center4326, 'EPSG:4326', 'ESRI:54009');

const source = new XYZ({
  transition: 0,
  minZoom: 5,
  maxZoom: 5,
  url: '/data/tiles/osm/{z}/{x}/{y}.png'
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
    projection: 'ESRI:54009',
    center: center,
    zoom: 6
  })
});

render();
