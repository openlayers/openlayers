import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import BingMaps from '../src/ol/source/BingMaps.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var osm = new TileLayer({
  source: new _ol_source_OSM_()
});
var bing = new TileLayer({
  source: new BingMaps({
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
    imagerySet: 'Aerial'
  })
});

var map = new Map({
  layers: [osm, bing],
  target: 'map',
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

var swipe = document.getElementById('swipe');

bing.on('precompose', function(event) {
  var ctx = event.context;
  var width = ctx.canvas.width * (swipe.value / 100);

  ctx.save();
  ctx.beginPath();
  ctx.rect(width, 0, ctx.canvas.width - width, ctx.canvas.height);
  ctx.clip();
});

bing.on('postcompose', function(event) {
  var ctx = event.context;
  ctx.restore();
});

swipe.addEventListener('input', function() {
  map.render();
}, false);
