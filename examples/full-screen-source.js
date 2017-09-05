import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_control_FullScreen_ from '../src/ol/control/fullscreen';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';


var view = new _ol_View_({
  center: [-9101767, 2822912],
  zoom: 14
});

var map = new _ol_Map_({
  controls: _ol_control_.defaults().extend([
    new _ol_control_FullScreen_({
      source: 'fullscreen'
    })
  ]),
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: view
});
