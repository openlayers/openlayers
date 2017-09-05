import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_interaction_ from '../src/ol/interaction';
import _ol_interaction_DragRotateAndZoom_ from '../src/ol/interaction/dragrotateandzoom';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';


var map = new _ol_Map_({
  interactions: _ol_interaction_.defaults().extend([
    new _ol_interaction_DragRotateAndZoom_()
  ]),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});
