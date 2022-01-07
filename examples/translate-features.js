import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {
  Select,
  Translate,
  defaults as defaultInteractions,
} from '../src/ol/interaction.js';
import {fromLonLat} from '../src/ol/proj.js';

const vector = new VectorLayer({
  background: 'white',
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/us-states.json',
    format: new GeoJSON(),
  }),
});

const select = new Select();

const translate = new Translate({
  features: select.getFeatures(),
});

const map = new Map({
  interactions: defaultInteractions().extend([select, translate]),
  layers: [vector],
  target: 'map',
  view: new View({
    center: fromLonLat([-100, 38.5]),
    zoom: 4,
  }),
});
