import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import {toStringHDMS} from 'ol/coordinate';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat, toLonLat} from 'ol/proj';
import OSM from 'ol/source/OSM';


const layer = new TileLayer({
  source: new OSM()
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const pos = fromLonLat([16.3725, 48.208889]);

// Vienna marker
const marker = new Overlay({
  position: pos,
  positioning: 'center-center',
  element: document.getElementById('marker'),
  stopEvent: false
});
map.addOverlay(marker);

// Vienna label
const vienna = new Overlay({
  position: pos,
  element: document.getElementById('vienna')
});
map.addOverlay(vienna);

// Popup showing the position the user clicked
const popup = new Overlay({
  element: document.getElementById('popup')
});
map.addOverlay(popup);

map.on('click', function(evt) {
  const element = popup.getElement();
  const coordinate = evt.coordinate;
  const hdms = toStringHDMS(toLonLat(coordinate));

  $(element).popover('destroy');
  popup.setPosition(coordinate);
  $(element).popover({
    placement: 'top',
    animation: false,
    html: true,
    content: '<p>The location you clicked was:</p><code>' + hdms + '</code>'
  });
  $(element).popover('show');
});
