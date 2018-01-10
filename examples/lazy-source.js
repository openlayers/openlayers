import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

var source = new OSM();

var layer = new TileLayer();

var map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

document.getElementById('set-source').onclick = function() {
  layer.setSource(source);
};

document.getElementById('unset-source').onclick = function() {
  layer.setSource(null);
};
