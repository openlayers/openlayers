import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  convertToRGB: true,
  sources: [{url: '/data/raster/non-square-pixels.tif'}],
  transition: 0,
});

new Map({
  target: 'map',
  layers: [new TileLayer({source})],
  view: source.getView().then((config) => ({
    ...config,
    zoom: 0,
    rotation: Math.PI / 6,
  })),
});

render({
  message: 'properly renders rotated non-square pixels',
});
