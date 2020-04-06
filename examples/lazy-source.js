import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';

const source = new OSM();

const layer = new TileLayer();

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

document.getElementById('set-source').onclick = function () {
  layer.setSource(source);
};

document.getElementById('unset-source').onclick = function () {
  layer.setSource(null);
};
