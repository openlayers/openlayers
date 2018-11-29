import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls, ScaleLine} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const unitsSelect = document.getElementById('units');
const typeSelect = document.getElementById('type');
const stepsSelect = document.getElementById('steps');
const scaleTextCheckbox = document.getElementById('showScaleText');
const showScaleTextDiv = document.getElementById('showScaleTextDiv');

let scaleType = 'scaleline';
let scaleBarSteps = 4;
let scaleBarText = true;
let control;

function scaleControl() {
  if (scaleType === 'scaleline') {
    control = new ScaleLine({
      units: unitsSelect.value
    });
    return control;
  }
  control = new ScaleLine({
    units: unitsSelect.value,
    bar: true,
    steps: scaleBarSteps,
    text: scaleBarText,
    minWidth: 140
  });
  return control;
}
const map = new Map({
  controls: defaultControls().extend([
    scaleControl()
  ]),
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

function onChange() {
  control.setUnits(unitsSelect.value);
}
function onChangeType() {
  scaleType = typeSelect.value;
  if (typeSelect.value === 'scalebar') {
    stepsSelect.style.display = 'inline';
    showScaleTextDiv.style.display = 'inline';
    map.removeControl(control);
    map.addControl(scaleControl());
  } else {
    stepsSelect.style.display = 'none';
    showScaleTextDiv.style.display = 'none';
    map.removeControl(control);
    map.addControl(scaleControl());
  }
}
function onChangeSteps() {
  scaleBarSteps = parseInt(stepsSelect.value, 10);
  map.removeControl(control);
  map.addControl(scaleControl());
}
function onChangeScaleText() {
  scaleBarText = scaleTextCheckbox.checked;
  map.removeControl(control);
  map.addControl(scaleControl());
}
unitsSelect.addEventListener('change', onChange);
typeSelect.addEventListener('change', onChangeType);
stepsSelect.addEventListener('change', onChangeSteps);
scaleTextCheckbox.addEventListener('change', onChangeScaleText);
