import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';

var source = new _ol_source_OSM_();

var layer = new _ol_layer_Tile_();

var map = new _ol_Map_({
  layers: [layer],
  target: 'map',
  view: new _ol_View_({
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
