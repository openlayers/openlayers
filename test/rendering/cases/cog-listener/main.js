import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/sentinel-b08.tif',
    },
  ],
  transition: 0,
});

const layer = new TileLayer({
  style: {
    color: [
      'case',
      ['==', ['band', 2], 0],
      'rgba(0,0,0,0)',
      ['!=', ['band', 2], 1],
      'rgba(255,0,0,1)',
      ['array', ['band', 1], ['band', 1], ['band', 1], ['band', 2]],
    ],
  },
  source: source,
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: source.getView(),
});

// these listeners cause renderer to be created before source is loaded
map.on('loadstart', function () {});
map.on('loadend', function () {});
map.on('rendercomplete', function () {});

// create renderer directly just in case
layer.getRenderer();

render({
  message: 'alpha styled from band 2',
});
