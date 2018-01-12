import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import XYZ from '../src/ol/source/XYZ.js';

const url = 'https://{a-c}.tiles.mapbox.com/v3/mapbox.world-bright/{z}/{x}/{y}.png';

const withTransition = new TileLayer({
  source: new XYZ({url: url})
});

const withoutTransition = new TileLayer({
  source: new XYZ({url: url, transition: 0}),
  visible: false
});

const map = new Map({
  layers: [withTransition, withoutTransition],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    maxZoom: 11
  })
});

document.getElementById('transition').addEventListener('change', function(event) {
  const transition = event.target.checked;
  withTransition.setVisible(transition);
  withoutTransition.setVisible(!transition);
});
