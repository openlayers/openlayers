import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_TileJSON_ from '../src/ol/source/tilejson';

function transform(extent) {
  return _ol_proj_.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

var extents = {
  India: transform([68.17665, 7.96553, 97.40256, 35.49401]),
  Argentina: transform([-73.41544, -55.25, -53.62835, -21.83231]),
  Nigeria: transform([2.6917, 4.24059, 14.57718, 13.86592]),
  Sweden: transform([11.02737, 55.36174, 23.90338, 69.10625])
};

var base = new _ol_layer_Tile_({
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
    crossOrigin: 'anonymous'
  })
});

var overlay = new _ol_layer_Tile_({
  extent: extents.India,
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.world-black.json?secure',
    crossOrigin: 'anonymous'
  })
});

var map = new _ol_Map_({
  layers: [base, overlay],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});

for (var key in extents) {
  document.getElementById(key).onclick = function(event) {
    overlay.setExtent(extents[event.target.id]);
  };
}
