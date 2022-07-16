import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';

const scaleBarOptionsContainer = document.getElementById('scaleBarOptions');
const unitsSelect = document.getElementById('units');
const typeSelect = document.getElementById('type');
const stepsSelect = document.getElementById('steps');
const scaleTextCheckbox = document.getElementById('showScaleText');

let control;

function scaleControl() {
  if (typeSelect.value === 'scaleline') {
    control = new ScaleLine({
      units: unitsSelect.value,
    });
    scaleBarOptionsContainer.style.display = 'none';
  } else {
    control = new ScaleLine({
      units: unitsSelect.value,
      bar: true,
      steps: parseInt(stepsSelect.value, 10),
      text: scaleTextCheckbox.checked,
      minWidth: 140,
    });
    scaleBarOptionsContainer.style.display = 'block';
  }
  return control;
}
const map = new Map({
  controls: defaultControls().extend([scaleControl()]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

function reconfigureScaleLine() {
  map.removeControl(control);
  map.addControl(scaleControl());
}
function onChangeUnit() {
  control.setUnits(unitsSelect.value);
}
unitsSelect.addEventListener('change', onChangeUnit);
typeSelect.addEventListener('change', reconfigureScaleLine);
stepsSelect.addEventListener('change', reconfigureScaleLine);
scaleTextCheckbox.addEventListener('change', reconfigureScaleLine);
