import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

const source = new GeoZarr({
  // url: 'https://storage.googleapis.com/open-cogs/geozarr/S2A_MSIL2A_20251025T095111_N0511_R079_T33SVB_20251025T121315.zarr',
  url: 'https://s3.explorer.eopf.copernicus.eu/esa-zarr-sentinel-explorer-fra/tests-output/sentinel-2-l2a-staging/S2B_MSIL2A_20251115T091139_N0511_R050_T35SLU_20251115T111807.zarr',
  group: 'measurements/reflectance',
  bands: ['b04', 'b03', 'b02'],
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
    withHigherResolutions(2),
    withExtentCenter(),
  ),
});
