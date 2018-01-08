import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import _ol_layer_Image_ from '../src/ol/layer/Image.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_ImageWMS_ from '../src/ol/source/ImageWMS.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';


var layers = [
  new TileLayer({
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
var map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4
  })
});
