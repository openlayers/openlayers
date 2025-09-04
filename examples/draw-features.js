import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Draw from '../src/ol/interaction/Draw.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource({wrapX: false});

const vector = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});

const typeSelect = document.getElementById('type');

let draw; // global so we can remove it later
function addInteraction() {
  draw = new Draw({
    source: source,
    type: typeSelect.value !== 'None' ? typeSelect.value : 'Point',
  });

  if (typeSelect.value === 'None') {
    draw.setActive(false);
  }

  map.addInteraction(draw);
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  if (typeSelect.value !== 'None') {
    draw.setActive(true);
    draw.setType(typeSelect.value);
  } else {
    draw.setActive(false);
  }
};

document.getElementById('undo').addEventListener('click', function () {
  draw.removeLastPoint();
});

addInteraction();
