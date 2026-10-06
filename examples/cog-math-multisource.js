import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://cloudlessdownloads.eox.at/api/public/dl/jvu06wnt/OpenLayers_Sentinel-2_samples/R10m.tif',
      bands: [3, 4],
      nodata: 0,
    },
    {
      url: 'https://cloudlessdownloads.eox.at/api/public/dl/jvu06wnt/OpenLayers_Sentinel-2_samples/R60m.tif',
      bands: [9],
      nodata: 0,
    },
  ],
  normalize: false,
});
source.setAttributions(
  "<a href='https://s2maps.eu'>Sentinel-2 cloudless</a> by <a href='https://eox.at/'>EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2019)",
);

const ndvi = [
  '/',
  ['-', ['band', 2], ['band', 1]],
  ['+', ['band', 2], ['band', 1]],
];

const ndwi = [
  '/',
  ['-', ['band', 3], ['band', 1]],
  ['+', ['band', 3], ['band', 1]],
];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      style: {
        color: [
          'case',
          [
            'any',
            ['==', ['band', 1], 0],
            ['==', ['band', 2], 0],
            ['==', ['band', 3], 0],
          ],
          [0, 0, 0, 0],
          [
            'color',
            // red: | NDVI - NDWI |
            ['*', 255, ['abs', ['-', ndvi, ndwi]]],
            // green: NDVI
            ['*', 255, ndvi],
            // blue: NDWI
            ['*', 255, ndwi],
          ],
        ],
      },
      source,
    }),
  ],
  view: new View({
    center: [1447120, 6165360],
    zoom: 11,
  }),
});
