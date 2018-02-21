// NOCOMPILE
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const view = new View({
  center: [0, 0],
  zoom: 2
});
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: view
});

function el(id) {
  return document.getElementById(id);
}


const gn = new GyroNorm();

gn.init().then(function() {
  gn.start(function(event) {
    const center = view.getCenter();
    const resolution = view.getResolution();
    const alpha = event.do.alpha * Math.PI / 180;
    const beta = event.do.beta * Math.PI / 180;
    const gamma = event.do.gamma * Math.PI / 180;

    el('alpha').innerText = alpha + ' [rad]';
    el('beta').innerText = beta + ' [rad]';
    el('gamma').innerText = gamma + ' [rad]';

    center[0] -= resolution * gamma * 25;
    center[1] += resolution * beta * 25;

    view.setCenter(view.constrainCenter(center));
  });
});
