import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import Overlay from '../src/ol/Overlay.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';
import {toStringHDMS} from '../src/ol/coordinate.js';

const layer = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const pos = fromLonLat([16.3725, 48.208889]);

// Popup showing the position the user clicked
const popup = new Overlay({
  element: document.getElementById('popup'),
});
map.addOverlay(popup);

// Vienna marker
const marker = new Overlay({
  position: pos,
  positioning: 'center-center',
  element: document.getElementById('marker'),
  stopEvent: false,
});
map.addOverlay(marker);

// Vienna label
const vienna = new Overlay({
  position: pos,
  element: document.getElementById('vienna'),
});
map.addOverlay(vienna);

const element = popup.getElement();
map.on('click', function (evt) {
  const coordinate = evt.coordinate;
  const hdms = toStringHDMS(toLonLat(coordinate));
  popup.setPosition(coordinate);
  let popover = bootstrap.Popover.getInstance(element);
  if (popover) {
    popover.dispose();
  }
  popover = new bootstrap.Popover(element, {
    animation: false,
    container: element,
    content: '<p>The location you clicked was:</p><code>' + hdms + '</code>',
    html: true,
    placement: 'top',
    title: 'Welcome to OpenLayers',
  });
  popover.show();
});
