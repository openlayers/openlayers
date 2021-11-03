import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import {
  Control,
  FullScreen,
  defaults as defaultControls,
} from '../src/ol/control.js';
import {fromLonLat} from '../src/ol/proj.js';

class UnusableMask extends Control {
  constructor() {
    super({
      element: document.createElement('div'),
    });
    this.element.setAttribute('hidden', 'hidden');
    this.element.className = 'ol-mask';
    this.element.innerHTML = '<div>Map not usable</div>';
  }
}

const localMapTarget = document.getElementById('map');

const map = new Map({
  target: localMapTarget,
  controls: defaultControls().extend([new FullScreen(), new UnusableMask()]),
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
function closeMapWindow() {
  if (mapWindow) {
    mapWindow.close();
    mapWindow = undefined;
  }
}
// Close external window in case the main page is closed or reloaded
window.addEventListener('pagehide', closeMapWindow);

const button = document.getElementById('external-map-button');

function resetMapTarget() {
  localMapTarget.style.height = '';
  map.setTarget(localMapTarget);
  button.disabled = false;
}

function updateOverlay() {
  if (!mapWindow) {
    return;
  }
  const externalMapTarget = mapWindow.document.getElementById('map');
  if (!externalMapTarget) {
    return;
  }
  if (document.visibilityState === 'visible') {
    // Show controls and enable keyboard input
    externalMapTarget.classList.remove('unusable');
    externalMapTarget.setAttribute('tabindex', '0');
    externalMapTarget.focus();
  } else {
    // Hide all controls and disable keyboard input
    externalMapTarget.removeAttribute('tabindex');
    externalMapTarget.classList.add('unusable');
  }
}
window.addEventListener('visibilitychange', updateOverlay);

button.addEventListener('click', function () {
  const blockerNotice = document.getElementById('blocker-notice');
  blockerNotice.setAttribute('hidden', 'hidden');
  button.disabled = true;

  // Reset button and map target in case window did not load or open
  let timeoutKey = setTimeout(function () {
    closeMapWindow();
    resetMapTarget();
    blockerNotice.removeAttribute('hidden');
    timeoutKey = undefined;
  }, 3000);

  mapWindow = window.open(
    'resources/external-map-map.html',
    'MapWindow',
    'toolbar=0,location=0,menubar=0,width=800,height=600'
  );
  mapWindow.addEventListener('DOMContentLoaded', function () {
    const externalMapTarget = mapWindow.document.getElementById('map');
    localMapTarget.style.height = '0px';
    map.setTarget(externalMapTarget);

    if (timeoutKey) {
      timeoutKey = clearTimeout(timeoutKey);
    }
    mapWindow.addEventListener('pagehide', function () {
      resetMapTarget();
      // Close window in case user does a page reload
      closeMapWindow();
    });

    updateOverlay();
  });
});
