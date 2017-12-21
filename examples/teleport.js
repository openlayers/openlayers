import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';


var map = new Map({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    })
  ],
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

map.setTarget('map1');

var teleportButton = document.getElementById('teleport');

teleportButton.addEventListener('click', function() {
  var target = map.getTarget() === 'map1' ? 'map2' : 'map1';
  map.setTarget(target);
}, false);
