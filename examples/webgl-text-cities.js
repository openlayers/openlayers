import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const source = new VectorSource({
  url: 'data/geojson/world-cities.geojson',
  format: new GeoJSON(),
});

// A single WebGLVectorLayer draws both the city symbol and its name: the
// `circle-*` and `text-*` properties live in one flat style on one source.
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
        'text-value': ['get', 'accentcity'],
        'text-font': 'bold 14px Arial',
        'text-fill-color': '#000000',
        'text-stroke-color': 'rgba(255, 255, 255, 0.6)',
        'text-stroke-width': 2,
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
