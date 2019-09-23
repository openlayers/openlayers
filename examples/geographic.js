import {useGeographic} from '../src/ol/proj.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

useGeographic();

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [-110, 45],
    zoom: 8
  })
});

const info = document.getElementById('info');
map.on('moveend', function() {
  const view = map.getView();
  const center = view.getCenter();
  info.innerText = `lon: ${center[0].toFixed(2)}, lat: ${center[1].toFixed(2)}`;
});
