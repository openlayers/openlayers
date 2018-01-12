import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import _ol_has_ from '../src/ol/has.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const layer = new TileLayer({
  source: new OSM()
});

const view = new View({
  center: [0, 0],
  zoom: 1
});

const map1 = new Map({
  target: 'canvasMap',
  layers: [layer],
  view: view
});

if (_ol_has_.WEBGL) {
  const map2 = new Map({
    target: 'webglMap',
    renderer: /** @type {Array<ol.renderer.Type>} */ (['webgl', 'canvas']),
    layers: [layer],
    view: view
  });
} else {
  const info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}
