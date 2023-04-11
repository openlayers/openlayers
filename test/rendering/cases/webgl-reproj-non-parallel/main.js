import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import proj4 from 'proj4';
import {
  get as getProjection,
  transformExtent,
} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';

proj4.defs('EPSG:32632', '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32636', '+proj=utm +zone=36 +datum=WGS84 +units=m +no_defs');
register(proj4);

getProjection('EPSG:32632').setExtent([-3500000, 0, 4500000, 10000000]);
getProjection('EPSG:32636').setExtent([-3500000, 0, 4500000, 10000000]);

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/sentinel-b04.tif',
      min: 0,
      max: 10000,
    },
    {
      url: '/data/raster/sentinel-b08.tif',
      min: 0,
      max: 10000,
    },
  ],
  transition: 0,
});

const layer = new TileLayer({
  source: source,
  style: {
    color: [
      'interpolate',
      ['linear'],
      ['/', ['-', ['band', 2], ['band', 1]], ['+', ['band', 2], ['band', 1]]],
      -0.2,
      ['color', 200, 0, 0, ['band', 3]],
      1,
      ['color', 0, 255, 0, ['band', 3]],
    ],
  },
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    projection: 'EPSG:32632',
  }),
});

source.getView().then(function (options) {
  const view = map.getView();
  view.fit(
    transformExtent(options.extent, options.projection, view.getProjection())
  );
});

render({
  message: 'renders non-parallel reprojection',
});
