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

const freehandCheckbox = document.getElementById('freehand');

const draw = new Draw({
  source: source,
  type: 'LineString',
  freehand: freehandCheckbox.checked,
});
map.addInteraction(draw);

/**
 * Use the selected geometry type, or stop drawing for "None".
 */
function updateType() {
  const value = typeSelect.value;
  if (value === 'None') {
    draw.setActive(false);
  } else {
    draw.setType(value);
    draw.setActive(true);
  }
}

/**
 * Handle change event.
 */
typeSelect.onchange = updateType;

/**
 * Handle change event.
 */
freehandCheckbox.onchange = function () {
  draw.setFreehand(freehandCheckbox.checked);
};

updateType();
