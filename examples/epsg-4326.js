import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_control_ from '../src/ol/control.js';
import _ol_control_ScaleLine_ from '../src/ol/control/ScaleLine.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';


var layers = [
  new _ol_layer_Tile_({
    source: new _ol_source_TileWMS_({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {
        'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
        'TILED': true
      }
    })
  })
];

var map = new _ol_Map_({
  controls: _ol_control_.defaults().extend([
    new _ol_control_ScaleLine_({
      units: 'degrees'
    })
  ]),
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});
