import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Graticule from '../../../../src/ol/layer/Graticule.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {fromLonLat, get, transformExtent} from '../../../../src/ol/proj.js';
import Stroke from '../../../../src/ol/style/Stroke.js';

proj4.defs(
  'EPSG:9311',
  '+proj=laea +lat_0=45 +lon_0=-100 +x_0=0 +y_0=0 +ellps=clrk66 ' +
    '+towgs84=2.478,149.752,197.726,-0.526,-0.498,0.501,0.685 ' +
    '+units=m +no_defs +type=crs',
);
register(proj4);

const proj9311 = get('EPSG:9311');
const worldExtent = [167.65, 15.56, -65.69, 74.71];
proj9311.setWorldExtent(worldExtent);
const extent = worldExtent.slice();
extent[2] += 360;
proj9311.setExtent(transformExtent(extent, 'EPSG:4326', 'EPSG:9311', 8));

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new Graticule({
      strokeStyle: new Stroke({
        color: 'rgba(255,120,0,0.9)',
        width: 2,
        lineDash: [0.5, 4],
      }),
      showLabels: true,
    }),
  ],
  view: new View({
    projection: 'EPSG:9311',
    center: fromLonLat([-98, 52], 'EPSG:9311'),
    resolution: 20000,
  }),
});

render();
