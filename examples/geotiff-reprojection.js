import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {register} from '../src/ol/proj/proj4.js';
import {transform} from '../src/ol/proj.js';

// register the proj4 library for use with coordinate transforms
register(proj4);

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [new TileLayer({source})],
  view: new View({
    center: [0, 0],
    zoom: 12,
  }),
});

// after GeoTIFF metadata has been read, recenter the map to show the image
source.getView().then(async (config) => {
  // transform the image center to view coorindates
  const center = transform(config.center, config.projection, 'EPSG:3857');

  // update the view to show the image
  const view = map.getView();
  view.setCenter(center);
});
