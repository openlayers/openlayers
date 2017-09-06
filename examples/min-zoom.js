import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';

var viewport = document.getElementById('map');

function getMinZoom() {
  var width = viewport.clientWidth;
  return Math.ceil(Math.LOG2E * Math.log(width / 256));
}

var initialZoom = getMinZoom();

var view = new _ol_View_({
  center: [0, 0],
  minZoom: initialZoom,
  zoom: initialZoom
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: view
});

window.addEventListener('resize', function() {
  var minZoom = getMinZoom();
  if (minZoom !== view.getMinZoom()) {
    view.setMinZoom(minZoom);
  }
});
