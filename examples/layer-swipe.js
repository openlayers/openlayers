import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import BingMaps from '../src/ol/source/BingMaps.js';
import OSM from '../src/ol/source/OSM.js';

const osm = new TileLayer({
  source: new OSM()
});
const bing = new TileLayer({
  source: new BingMaps({
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
    imagerySet: 'Aerial'
  })
});

const map = new Map({
  layers: [osm, bing],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const swipe = document.getElementById('swipe');

bing.on('prerender', function(event) {
  const ctx = event.context;
  const width = ctx.canvas.width * (swipe.value / 100);

  ctx.save();
  ctx.beginPath();
  ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
  ctx.clip();
});

bing.on('postrender', function(event) {
  const ctx = event.context;
  ctx.restore();
});

swipe.addEventListener('input', function() {
  map.render();
}, false);
