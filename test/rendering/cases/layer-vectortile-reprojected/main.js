import {MapboxVectorLayer} from 'ol-mapbox-style';
import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import {fromLonLat} from '../../../../src/ol/proj.js';

proj4.defs(
  'EPSG:31287',
  '+proj=lcc +lat_1=46.8 +lat_2=47.8 +lat_0=46.5 +lon_0=13.333333333333334 ' +
    '+x_0=400000 +y_0=400000 +ellps=bessel ' +
    '+towgs84=577.326,90.129,463.919,5.137,1.474,-5.297,2.423 +units=m +no_defs',
);

register(proj4);

const mapboxVectorLayer = new MapboxVectorLayer({
  styleUrl: '/data/styles/bright-v9/style.json',
});

new Map({
  layers: [mapboxVectorLayer],
  target: 'map',
  view: new View({
    projection: 'EPSG:31287',
    center: fromLonLat([16.3731, 48.2083], 'EPSG:31287'),
    zoom: 18,
  }),
});

render({
  message: 'Vector tile layer declutters image with text correctly',
  tolerance: 0.01,
});
