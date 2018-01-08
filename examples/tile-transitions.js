import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';

var url = 'https://{a-c}.tiles.mapbox.com/v3/mapbox.world-bright/{z}/{x}/{y}.png';

var withTransition = new TileLayer({
  source: new _ol_source_XYZ_({url: url})
});

var withoutTransition = new TileLayer({
  source: new _ol_source_XYZ_({url: url, transition: 0}),
  visible: false
});

var map = new Map({
  layers: [withTransition, withoutTransition],
  target: 'map',
  view: new View({
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
