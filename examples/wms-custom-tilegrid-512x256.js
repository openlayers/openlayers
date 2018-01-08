import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {get as getProjection} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';
import TileGrid from '../src/ol/tilegrid/TileGrid.js';


var projExtent = getProjection('EPSG:3857').getExtent();
var startResolution = _ol_extent_.getWidth(projExtent) / 256;
var resolutions = new Array(22);
for (var i = 0, ii = resolutions.length; i < ii; ++i) {
  resolutions[i] = startResolution / Math.pow(2, i);
}
var tileGrid = new TileGrid({
  extent: [-13884991, 2870341, -7455066, 6338219],
  resolutions: resolutions,
  tileSize: [512, 256]
});

var layers = [
  new TileLayer({
    source: new OSM()
  }),
  new TileLayer({
    source: new _ol_source_TileWMS_({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {'LAYERS': 'topp:states', 'TILED': true},
      serverType: 'geoserver',
      tileGrid: tileGrid
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
