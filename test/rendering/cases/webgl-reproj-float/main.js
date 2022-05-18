import GeoTIFF from '../../../../src/ol/source/GeoTIFF.js';
import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';

const source = new GeoTIFF({
  convertToRGB: true,
  normalize: false,
  sources: [
    {
      nodata: NaN,
      url: '/data/raster/non-square-pixels.tif',
    },
  ],
});

new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
      style: {
        color: [
          'array',
          ['/', ['band', 1], 255],
          ['/', ['band', 2], 255],
          ['/', ['band', 3], 255],
          ['/', ['band', 4], 255],
        ],
      },
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0,
    rotation: -Math.PI / 6,
  }),
});

render({
  message: 'renders float reprojected',
});
