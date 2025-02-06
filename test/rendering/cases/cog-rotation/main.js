import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import TileDebug from '../../../../src/ol/source/TileDebug.js';

proj4.defs(
  'EPSG:32759',
  '+proj=utm +zone=59 +south +datum=WGS84 +units=m +no_defs',
);
register(proj4);

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/umbra.tif',
    },
  ],
  transition: 0,
});

new Map({
  layers: [
    new TileLayer({
      source: source,
    }),
    new TileLayer({
      source: new TileDebug(),
      opacity: 0.8,
    }),
  ],
  target: 'map',
  view: source.getView(),
});

render({
  message: 'works with geotiffs that include a ModelTransformation rotation',
});
