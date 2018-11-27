import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';


const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
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
