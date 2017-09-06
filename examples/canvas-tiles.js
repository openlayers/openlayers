import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileDebug_ from '../src/ol/source/tiledebug';


var osmSource = new _ol_source_OSM_();
var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: osmSource
    }),
    new _ol_layer_Tile_({
      source: new _ol_source_TileDebug_({
        projection: 'EPSG:3857',
        tileGrid: osmSource.getTileGrid()
      })
    })
  ],
  target: 'map',
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new _ol_View_({
    center: _ol_proj_.transform(
        [-0.1275, 51.507222], 'EPSG:4326', 'EPSG:3857'),
    zoom: 10
  })
});
