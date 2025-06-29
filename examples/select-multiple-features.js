import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {always} from '../src/ol/events/condition.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Select from '../src/ol/interaction/Select.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorSource from '../src/ol/source/Vector.js';

const select = new Select({
  toggleCondition: always,
  multi: true,
});

const vector = new VectorLayer({
  background: 'white',
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/us-states.json',
    format: new GeoJSON(),
  }),
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: fromLonLat([-100, 38.5]),
    zoom: 4,
    multiWorld: true,
  }),
});
map.addInteraction(select);

const status = document.getElementById('status');

select.on('select', function () {
  status.innerHTML =
    '&nbsp;' + select.getFeatures().getLength() + ' selected features';
});
