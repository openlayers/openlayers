import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';

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
  transition: 100,
});

const nir = ['band', 2];
const red = ['band', 1];
const ndvi = ['/', ['-', nir, red], ['+', nir, red]];

const layer = new TileLayer({
  source: source,
  style: {
    color: [
      'palette',
      ['interpolate', ['linear'], ndvi, -0.2, 0, 0.65, 4],
      ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
    ],
  },
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: source.getView(),
});

// regression test for https://github.com/openlayers/openlayers/issues/15786
map.once('rendercomplete', () => {
  map.removeLayer(layer);
  map.addLayer(layer);
  render({
    message: 'palette still works after adding and removing layer',
  });
});
