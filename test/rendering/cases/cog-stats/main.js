import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';

const source = new GeoTIFF({
  sources: [{url: '/data/raster/sentinel-b08.tif'}],
  transition: 0,
});

const layer = new TileLayer({
  source: source,
});

layer.setStyle({
  color: ['array', ['band', 1], ['band', 1], ['band', 1], ['band', 2]],
});

new Map({
  layers: [layer],
  target: 'map',
  view: source.getView(),
});

render({
  message: 'normalize data based on GDAL stats',
});
