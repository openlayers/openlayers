import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_control_ScaleLine_ from '../src/ol/control/scaleline';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_TileWMS_ from '../src/ol/source/tilewms';


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
