import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Link from '../src/ol/interaction/Link.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const map = new Map({
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

const link = new Link();

const exampleCheckbox = document.getElementById('example-checkbox');
exampleCheckbox.addEventListener('change', function () {
  if (exampleCheckbox.checked) {
    link.update('example', 'checked');
  } else {
    // updating to null will remove the param from the URL
    link.update('example', null);
  }
});

const initialValue = link.track('example', (newValue) => {
  exampleCheckbox.checked = newValue === 'checked';
});

exampleCheckbox.checked = initialValue === 'checked';

map.addInteraction(link);
