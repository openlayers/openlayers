import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';
import _ol_source_OSM_ from '../src/ol/source/osm';

var osm = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});
var bing = new _ol_layer_Tile_({
  source: new _ol_source_BingMaps_({
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
    imagerySet: 'Aerial'
  })
});

var map = new _ol_Map_({
  layers: [osm, bing],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new _ol_View_({
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
