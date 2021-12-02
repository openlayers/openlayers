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

new Map({
  layers: [
    new TileLayer({
      source: source,
      style: {
        color: [
          'interpolate',
          ['linear'],
          // calculate NDVI, bands come from the sources below
          [
            '/',
            ['-', ['band', 2], ['band', 1]],
            ['+', ['band', 2], ['band', 1]],
          ],
          // color ramp for NDVI values, ranging from -1 to 1
          -0.2,
          [191, 191, 191],
          -0.1,
          [219, 219, 219],
          0,
          [255, 255, 224],
          0.025,
          [255, 250, 204],
          0.05,
          [237, 232, 181],
          0.075,
          [222, 217, 156],
          0.1,
          [204, 199, 130],
          0.125,
          [189, 184, 107],
          0.15,
          [176, 194, 97],
          0.175,
          [163, 204, 89],
          0.2,
          [145, 191, 82],
          0.25,
          [128, 179, 71],
          0.3,
          [112, 163, 64],
          0.35,
          [97, 150, 54],
          0.4,
          [79, 138, 46],
          0.45,
          [64, 125, 36],
          0.5,
          [48, 110, 28],
          0.55,
          [33, 97, 18],
          0.6,
          [15, 84, 10],
          0.65,
          [0, 69, 0],
        ],
      },
    }),
  ],
  target: 'map',
  view: source.getView(),
});

render({
  message: 'normalized difference vegetation index',
});
