import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileWMS_ from '../src/ol/source/tilewms';
import _ol_tilegrid_TileGrid_ from '../src/ol/tilegrid/tilegrid';


var projExtent = _ol_proj_.get('EPSG:3857').getExtent();
var startResolution = _ol_extent_.getWidth(projExtent) / 256;
var resolutions = new Array(22);
for (var i = 0, ii = resolutions.length; i < ii; ++i) {
  resolutions[i] = startResolution / Math.pow(2, i);
}
var tileGrid = new _ol_tilegrid_TileGrid_({
  extent: [-13884991, 2870341, -7455066, 6338219],
  resolutions: resolutions,
  tileSize: [512, 256]
});

var layers = [
  new _ol_layer_Tile_({
    source: new _ol_source_OSM_()
  }),
  new _ol_layer_Tile_({
    source: new _ol_source_TileWMS_({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver',
      tileGrid: tileGrid
    })
  })
];
var map = new _ol_Map_({
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
