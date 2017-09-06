import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileWMS_ from '../src/ol/source/tilewms';


var layers = [
  new _ol_layer_Tile_({
    source: new _ol_source_OSM_()
  }),
  new _ol_layer_Tile_({
    source: new _ol_source_TileWMS_({
      url: 'https://ahocevar.com/geoserver/ne/wms',
      params: {'LAYERS': 'ne:ne_10m_admin_0_countries', 'TILED': true},
      serverType: 'geoserver'
    })
  })
];
var map = new _ol_Map_({
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});
