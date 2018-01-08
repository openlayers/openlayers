import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import _ol_has_ from '../src/ol/has.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var layer = new TileLayer({
  source: new _ol_source_OSM_()
});

var view = new View({
  center: [0, 0],
  zoom: 1
});

var map1 = new Map({
  target: 'canvasMap',
  layers: [layer],
  view: view
});

if (_ol_has_.WEBGL) {
  var map2 = new Map({
    target: 'webglMap',
    renderer: /** @type {Array<ol.renderer.Type>} */ (['webgl', 'canvas']),
    layers: [layer],
    view: view
  });
} else {
  var info = document.getElementById('no-webgl');
  /**
   * display error message
   */
  info.style.display = '';
}
