import proj4 from 'proj4';
import Map from '../../../../src/ol/Map.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import {register} from '../../../../src/ol/proj/proj4.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import TileDebug from '../../../../src/ol/source/TileDebug.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

proj4.defs(
  'SR-ORG:97019',
  '+proj=stere +lat_0=90 +lat_ts=60 +lon_0=10 +k=1 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs',
);
register(proj4);

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/de-bw.tif',
      min: 10,
      max: 360,
    },
  ],
  transition: 0,
});

new Map({
  layers: [
    new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url: '/data/de-bw.json',
      }),
      style: {
        'stroke-color': '#0ff',
        'stroke-width': 10,
      },
    }),
    new TileLayer({
      source: source,
    }),
    new TileLayer({
      source: new TileDebug({
        source: source,
      }),
    }),
  ],
  target: 'map',
  view: source.getView().then((viewConfig) => {
    viewConfig.projection = 'SR-ORG:97019';
    return viewConfig;
  }),
});

render({
  message: 'works with geotiffs that include a ModelTransformation',
});
