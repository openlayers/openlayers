import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const source = new XYZ({
  attributions: attributions,
  url: 'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=' + key,
  tileSize: 512,
});

const map = new Map({
  layers: [new TileLayer({source: source})],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

map.on('loadstart', function () {
  map.getTargetElement().classList.add('spinner');
});
map.on('loadend', function () {
  map.getTargetElement().classList.remove('spinner');
});
