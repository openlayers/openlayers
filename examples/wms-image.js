import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_ImageWMS_ from '../src/ol/source/imagewms';
import _ol_source_OSM_ from '../src/ol/source/osm';


var layers = [
  new _ol_layer_Tile_({
    source: new _ol_source_OSM_()
  }),
  new _ol_layer_Image_({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: new _ol_source_ImageWMS_({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states'},
      ratio: 1,
      serverType: 'geoserver'
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
