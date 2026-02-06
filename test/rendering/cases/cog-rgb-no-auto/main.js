import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  transition: 0,
  convertToRGB: false,
  sources: [{url: '/data/raster/masked.tif'}],
});

new Map({
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  target: 'map',
  view: source.getView().then((config) => ({
    ...config,
    zoom: 0,
  })),
});

render({
  message: 'can be overridden to read raw YCbCr',
});
