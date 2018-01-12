import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';


const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

map.setTarget('map1');

const teleportButton = document.getElementById('teleport');

teleportButton.addEventListener('click', function() {
  const target = map.getTarget() === 'map1' ? 'map2' : 'map1';
  map.setTarget(target);
}, false);
