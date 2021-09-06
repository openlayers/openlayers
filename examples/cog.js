import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import proj4 from 'proj4';
import {getCenter} from '../src/ol/extent.js';
import {register} from '../src/ol/proj/proj4.js';

proj4.defs('EPSG:32636', '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs');
register(proj4);

// metadata from https://s3.us-west-2.amazonaws.com/sentinel-cogs/sentinel-s2-l2a-cogs/2020/S2A_36QWD_20200701_0_L2A/S2A_36QWD_20200701_0_L2A.json
const sourceExtent = [499980, 1790220, 609780, 1900020];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new GeoTIFF({
        sources: [
          {
            url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/2020/S2A_36QWD_20200701_0_L2A/TCI.tif',
          },
        ],
      }),
      extent: sourceExtent,
    }),
  ],
  view: new View({
    projection: 'EPSG:32636',
    center: getCenter(sourceExtent),
    extent: sourceExtent,
    zoom: 9,
  }),
});
