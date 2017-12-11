import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_has_ from '../src/ol/has.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var layer = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var view = new _ol_View_({
  center: [0, 0],
  zoom: 1
});

var map1 = new _ol_Map_({
  target: 'canvasMap',
  layers: [layer],
  view: view
});

if (_ol_has_.WEBGL) {
  var map2 = new _ol_Map_({
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
