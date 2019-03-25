import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import XYZ from '../../../src/ol/source/XYZ.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import {get, transform} from '../../../src/ol/proj.js';
import {register} from '../../../src/ol/proj/proj4.js';
import proj4 from 'proj4';

proj4.defs('EPSG:5070',
  '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 ' +
          '+y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
register(proj4);
const proj5070 = get('EPSG:5070');
proj5070.setExtent([-6e6, 0, 4e6, 6e6]);

const center4326 = [-118.125, 31.95];
const center = transform(center4326, 'EPSG:4326', 'EPSG:5070');

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
    projection: 'EPSG:5070',
    center: center,
    zoom: 4
  })
});

render();
