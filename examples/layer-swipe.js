import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import XYZ from '../src/ol/source/XYZ.js';

const osm = new TileLayer({
  source: new OSM()
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const aerial = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
    maxZoom: 20
  })
});

const map = new Map({
  layers: [osm, aerial],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const swipe = document.getElementById('swipe');

aerial.on('prerender', function(event) {
  const ctx = event.context;
  const width = ctx.canvas.width * (swipe.value / 100);

  ctx.save();
  ctx.beginPath();
  ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
  ctx.clip();
});

aerial.on('postrender', function(event) {
  const ctx = event.context;
  ctx.restore();
});

swipe.addEventListener('input', function() {
  map.render();
}, false);
