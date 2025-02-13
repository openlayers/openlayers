import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: '/data/raster/not-a-cog.tif',
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
  view: source.getView().then((config) => ({
    ...config,
    zoom: 2,
  })),
});

render({
  message: 'render a geotiff that is not a cog',
});
