import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';

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
});

new Map({
  layers: [layer],
  target: 'map',
  view: source.getView(),
});

layer.setStyle({
  color: [
    'interpolate',
    ['linear'],
    ['/', ['-', ['band', 2], ['band', 1]], ['+', ['band', 2], ['band', 1]]],
    -0.2,
    [200, 0, 0],
    1,
    [0, 255, 0],
  ],
});

render({
  message: 'update the layer style',
});
