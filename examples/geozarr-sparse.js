import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
  withZoom,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

const source = new GeoZarr({
  url: 'https://storage.googleapis.com/open-cogs/geozarr/S2A_MSIL2A_20250922T112131_N0511_R037_T29SMD_20250922T160420.zarr',
  group: 'measurements/reflectance',
  bands: ['b11', 'b03', 'b02'],
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new TileLayer({
      style: {
        gamma: 1.5,
        color: [
          'color',
          ['interpolate', ['linear'], ['band', 1], 0, 0, 0.5, 255],
          ['interpolate', ['linear'], ['band', 2], 0, 0, 0.5, 255],
          ['interpolate', ['linear'], ['band', 3], 0, 0, 0.5, 255],
          [
            'case',
            ['==', ['+', ['band', 1], ['band', 2], ['band', 3]], 0],
            0,
            1,
          ],
        ],
      },
      source,
    }),
  ],
  target: 'map',
  view: getView(
    source,
    withLowerResolutions(1),
    withHigherResolutions(1),
    withExtentCenter(),
    withZoom(3),
  ),
});
