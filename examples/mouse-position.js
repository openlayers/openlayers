import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MousePosition from '../src/ol/control/MousePosition.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import {createStringXY} from '../src/ol/coordinate.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});

const map = new Map({
  controls: defaultControls().extend([mousePositionControl]),
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

const projectionSelect = /** @type {HTMLSelectElement} */ (
  document.getElementById('projection')
);
projectionSelect.addEventListener('change', function () {
  mousePositionControl.setProjection(this.value);
});

const precisionInput = /** @type {HTMLInputElement} */ (
  document.getElementById('precision')
);
precisionInput.addEventListener('change', function () {
  const format = createStringXY(this.valueAsNumber);
  mousePositionControl.setCoordinateFormat(format);
});
