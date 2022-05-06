import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';

const source = new GeoTIFF({
  convertToRGB: true,
  sources: [{url: '/data/raster/non-square-pixels.tif'}],
});

new Map({
  target: 'map',
  layers: [new TileLayer({source})],
  view: source.getView().then((config) => ({
    ...config,
    rotation: Math.PI / 6,
  })),
});

render({
  message: 'properly renders rotated non-square pixels',
});
