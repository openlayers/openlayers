import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://openlayers.org/data/raster/no-overviews.tif',
      overviews: ['https://openlayers.org/data/raster/no-overviews.tif.ovr'],
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  view: source.getView(),
});
