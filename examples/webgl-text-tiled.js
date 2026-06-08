import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {bbox as bboxStrategy} from '../src/ol/loadingstrategy.js';
import {useGeographic} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

useGeographic();

// A source that loads features on demand for the current view extent. The
// integrated WebGLVectorLayer drives this the same way the WebGL vector
// renderer does: it calls source.loadFeatures() as the extent changes.
const source = new VectorSource({
  format: new GeoJSON(),
  url: function () {
    return 'data/geojson/world-cities.geojson';
  },
  strategy: bboxStrategy,
});

// One layer renders both the city symbol and its label; labels appear for
// features as they are loaded for the current extent.
const labelsLayer = new WebGLVectorLayer({
  source: source,
  style: {
    'circle-radius': 3,
    'circle-fill-color': '#3399cc',
    'text-value': ['get', 'accentcity'],
    'text-font': 'bold 13px sans-serif',
    'text-fill-color': '#000000',
    'text-stroke-color': 'rgba(255, 255, 255, 0.85)',
    'text-stroke-width': 2,
  },
});

const info = document.getElementById('info');
source.on('featuresloadend', () => {
  info.textContent = `Loaded ${source.getFeatures().length} labelled features — pan/zoom to load more`;
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    labelsLayer,
  ],
  target: 'map',
  view: new View({
    center: [0, 20],
    zoom: 2,
  }),
});
