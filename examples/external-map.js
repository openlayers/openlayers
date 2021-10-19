import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {FullScreen, defaults as defaultControls} from '../src/ol/control.js';
import {fromLonLat} from '../src/ol/proj.js';

const map = new Map({
  target: 'map',
  controls: defaultControls().extend([new FullScreen()]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([37.41, 8.82]),
    zoom: 4,
  }),
});

let mapWindow;
const button = document.getElementById('extMap');
button.addEventListener('click', function () {
  const localMapTarget = document.getElementById('map');
  localMapTarget.style.height = '0px';
  button.disabled = true;

  mapWindow = window.open(
    'resources/external-map-map.html',
    'MapWindow',
    'toolbar=0,location=0,menubar=0,width=800,height=600'
  );
  mapWindow.addEventListener('load', function () {
    const extMapDiv = mapWindow.document.getElementById('map');
    map.setTarget(extMapDiv);
    extMapDiv.focus();

    mapWindow.addEventListener('beforeunload', function () {
      localMapTarget.style.height = '';
      map.setTarget(localMapTarget);
      button.disabled = false;

      mapWindow = undefined;
    });
  });
});
window.addEventListener('beforeunload', function () {
  if (mapWindow) {
    mapWindow.close();
  }
});
