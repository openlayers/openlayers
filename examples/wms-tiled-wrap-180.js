import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';


var layers = [
  new TileLayer({
    source: new OSM()
  }),
  new TileLayer({
    source: new _ol_source_TileWMS_({
      url: 'https://ahocevar.com/geoserver/ne/wms',
      params: {'LAYERS': 'ne:ne_10m_admin_0_countries', 'TILED': true},
      serverType: 'geoserver'
    })
  })
];
var map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1
  })
});
