import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Draw from '../src/ol/interaction/Draw.js';
import Modify from '../src/ol/interaction/Modify.js';
import Select from '../src/ol/interaction/Select.js';
import Snap from '../src/ol/interaction/Snap.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {useGeographic} from '../src/ol/proj.js';
import VectorSource from '../src/ol/source/Vector.js';

useGeographic();

const source = new VectorSource({
  url: 'https://openlayers.org/data/vector/us-states.json',
  format: new GeoJSON(),
});

const map = new Map({
  target: 'map',
  layers: [
    new VectorLayer({
      background: 'white',
      source: source,
    }),
  ],
  view: new View({
    center: [-100, 38.5],
    zoom: 4,
  }),
});

const select = new Select();

const modify = new Modify({
  features: select.getFeatures(),
});

const draw = new Draw({
  type: 'Polygon',
  source: source,
});

const snap = new Snap({
  source: source,
});

function removeInteractions() {
  map.removeInteraction(modify);
  map.removeInteraction(select);
  map.removeInteraction(draw);
  map.removeInteraction(select);
}

const mode = document.getElementById('mode');
function onChange() {
  removeInteractions();
  switch (mode.value) {
    case 'draw': {
      map.addInteraction(draw);
      map.addInteraction(snap);
      break;
    }
    case 'modify': {
      map.addInteraction(select);
      map.addInteraction(modify);
      map.addInteraction(snap);
      break;
    }
    default: {
      // pass
    }
  }
}
mode.addEventListener('change', onChange);
onChange();
