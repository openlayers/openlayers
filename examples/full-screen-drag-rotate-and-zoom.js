import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_control_ from '../src/ol/control.js';
import _ol_control_FullScreen_ from '../src/ol/control/FullScreen.js';
import _ol_interaction_ from '../src/ol/interaction.js';
import _ol_interaction_DragRotateAndZoom_ from '../src/ol/interaction/DragRotateAndZoom.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_BingMaps_ from '../src/ol/source/BingMaps.js';


var map = new _ol_Map_({
  controls: _ol_control_.defaults().extend([
    new _ol_control_FullScreen_()
  ]),
  interactions: _ol_interaction_.defaults().extend([
    new _ol_interaction_DragRotateAndZoom_()
  ]),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_BingMaps_({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  // Use the canvas renderer because it's currently the fastest
  target: 'map',
  view: new _ol_View_({
    center: [-33519607, 5616436],
    rotation: -Math.PI / 8,
    zoom: 8
  })
});
