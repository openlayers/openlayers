// NOCOMPILE
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {toRadians} from '../src/ol/math.js';
import OSM from '../src/ol/source/OSM.js';

var view = new View({
  center: [0, 0],
  zoom: 2
});
var map = new Map({
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


var gn = new GyroNorm();

gn.init().then(function() {
  gn.start(function(event) {
    var center = view.getCenter();
    var resolution = view.getResolution();
    var alpha = toRadians(event.do.beta);
    var beta = toRadians(event.do.beta);
    var gamma = toRadians(event.do.gamma);

    el('alpha').innerText = alpha + ' [rad]';
    el('beta').innerText = beta + ' [rad]';
    el('gamma').innerText = gamma + ' [rad]';

    center[0] -= resolution * gamma * 25;
    center[1] += resolution * beta * 25;

    view.setCenter(view.constrainCenter(center));
  });
});
