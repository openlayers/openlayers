import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLTextLayer from '../src/ol/layer/WebGLText.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const source = new VectorSource({
  url: 'data/geojson/world-cities.geojson',
  format: new GeoJSON(),
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new WebGLVectorLayer({
      source: source,
      style: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'population'],
          0,
          2,
          20000000,
          10,
        ],
        'circle-fill-color': [
          'match',
          ['get', 'country'],
          'India',
          [255, 153, 51, 0.8],
          [0, 150, 255, 0.6],
        ],
        'circle-stroke-color': [255, 255, 255, 1],
        'circle-stroke-width': 1,
      },
    }),
    new WebGLTextLayer({
      source: source,
      style: {
        'text': ['get', 'accentcity'],
        'font-family': 'Arial',
        'font-size': [
          'interpolate',
          ['linear'],
          ['get', 'population'],
          0,
          10,
          200000,
          24,
        ],
        'fill-color': '#000000',
        'stroke-color': [1.0, 1.0, 1.0, 0.3],
        'stroke-width': 2,
        'font-weight': 'bold',
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
