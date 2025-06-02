import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const scaleBarOptionsContainer = document.getElementById('scaleBarOptions');
const unitsSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('units')
);
const typeSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('type')
);
const stepsRange = /** @type {HTMLInputElement} */ (
  document.getElementById('steps')
);
const scaleTextCheckbox = /** @type {HTMLInputElement} */ (
  document.getElementById('showScaleText')
);
const invertColorsCheckbox = /** @type {HTMLInputElement} */ (
  document.getElementById('invertColors')
);

let control;

function scaleControl() {
  const unit = /** @type {'degrees'|'imperial'|'us'|'nautical'|'metric'} */ (
    unitsSelect.value
  );
  if (typeSelect.value === 'scaleline') {
    control = new ScaleLine({
      units: unit,
    });
    scaleBarOptionsContainer.style.display = 'none';
  } else {
    control = new ScaleLine({
      units: unit,
      bar: true,
      steps: parseInt(stepsRange.value, 10),
      text: scaleTextCheckbox.checked,
      minWidth: 140,
    });
    onInvertColorsChange();
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
function onInvertColorsChange() {
  control.element.classList.toggle(
    'ol-scale-bar-inverted',
    invertColorsCheckbox.checked,
  );
}
unitsSelect.addEventListener('change', onChangeUnit);
typeSelect.addEventListener('change', reconfigureScaleLine);
stepsRange.addEventListener('input', reconfigureScaleLine);
scaleTextCheckbox.addEventListener('change', reconfigureScaleLine);
invertColorsCheckbox.addEventListener('change', onInvertColorsChange);
