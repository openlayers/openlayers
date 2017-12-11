import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';

var url = 'https://{a-c}.tiles.mapbox.com/v3/mapbox.world-bright/{z}/{x}/{y}.png';

var withTransition = new _ol_layer_Tile_({
  source: new _ol_source_XYZ_({url: url})
});

var withoutTransition = new _ol_layer_Tile_({
  source: new _ol_source_XYZ_({url: url, transition: 0}),
  visible: false
});

var map = new _ol_Map_({
  layers: [withTransition, withoutTransition],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2,
    maxZoom: 11
  })
});

document.getElementById('transition').addEventListener('change', function(event) {
  var transition = event.target.checked;
  withTransition.setVisible(transition);
  withoutTransition.setVisible(!transition);
});
