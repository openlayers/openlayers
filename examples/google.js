import Google from '../src/ol/source/Google.js';
import Layer from '../src/ol/layer/WebGLTile.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';

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

  const map = new Map({
    layers: [new Layer({source})],
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
