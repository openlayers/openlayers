import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';

const source = new GeoTIFF({
  convertToRGB: true,
  sources: [{url: '/data/raster/masked.tif'}],
});

new Map({
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  target: 'map',
  view: source.getView(),
});

render({
  message: 'works with geotiffs that include a mask',
});
