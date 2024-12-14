import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Control from '../src/ol/control/Control.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import Layer from '../src/ol/layer/WebGLTile.js';
import Google from '../src/ol/source/Google.js';

function showMap(key) {
  const source = new Google({
    key,
    scale: 'scaleFactor2x',
    highDpi: true,
  });

  source.on('change', () => {
    if (source.getState() === 'error') {
      alert(source.getError());
    }
  });

  class GoogleLogoControl extends Control {
    constructor() {
      const element = document.createElement('img');
      element.style.pointerEvents = 'none';
      element.style.position = 'absolute';
      element.style.bottom = '5px';
      element.style.left = '5px';
      element.src =
        'https://developers.google.com/static/maps/documentation/images/google_on_white.png';
      super({
        element: element,
      });
    }
  }

  const map = new Map({
    layers: [new Layer({source})],
    controls: defaultControls().extend([new GoogleLogoControl()]),
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
  });
}

document.getElementById('key-form').addEventListener('submit', (event) => {
  showMap(event.target.elements['key'].value);
});
