import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

const source = new GeoZarr({
  url: 'http://localhost:5173/s2l2_test.zarr',
  group: 'measurements/reflectance/r20m',
  bands: ['b04', 'b03', 'b02'],
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new TileLayer({
      style: {
        color: [
          'color',
          ['*', 512, ['band', 1]],
          ['*', 512, ['band', 2]],
          ['*', 512, ['band', 3]],
          1,
        ],
      },
      source,
    }),
  ],
  target: 'map',
  view: source.getView(),
});
