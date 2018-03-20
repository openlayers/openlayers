import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import Draw from '../src/ol/interaction/Draw.js';

import smooth from 'chaikin-smooth';

function makeSmooth(path, numIterations) {
  numIterations = Math.min(Math.max(numIterations, 1), 10);
  while (numIterations > 0) {
    path = smooth(path);
    numIterations--;
  }
  return path;
}

const vectorSource = new VectorSource({});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.5
    }),
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [1078373.5950, 6871994.5910],
    zoom: 5
  })
});

const typeSelect = document.getElementById('type');
const shallSmoothen = document.getElementById('shall-smoothen');
const numIterations = document.getElementById('iterations');

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    draw = new Draw({
      source: vectorSource,
      type: typeSelect.value
    });
    map.addInteraction(draw);
    draw.on('drawend', function(event) {
      const feat = event.feature;
      const geometry = feat.getGeometry();
      const isPoly = geometry.getType() === 'Polygon';
      const isLine = geometry.getType() === 'LineString';
      if (shallSmoothen.checked && (isPoly || isLine)) {
        const coords = geometry.getCoordinates();
        const smoothened = makeSmooth(isPoly ? coords[0] : coords, parseInt(numIterations.value, 10) || 5);
        geometry.setCoordinates(isPoly ? [smoothened] : smoothened);
      }
    });
  }
}

/**
 * Handle change event.
 */
typeSelect.onchange = function() {
  map.removeInteraction(draw);
  addInteraction();
};

addInteraction();
