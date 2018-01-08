import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {get as getProjection} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import _ol_source_WMTS_ from '../src/ol/source/WMTS.js';
import WMTSTileGrid from '../src/ol/tilegrid/WMTS.js';


var projection = getProjection('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = _ol_extent_.getWidth(projectionExtent) / 256;
var resolutions = new Array(14);
var matrixIds = new Array(14);
for (var z = 0; z < 14; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.7
    }),
    new TileLayer({
      opacity: 0.7,
      source: new _ol_source_WMTS_({
        attributions: 'Tiles © <a href="https://services.arcgisonline.com/arcgis/rest/' +
            'services/Demographics/USA_Population_Density/MapServer/">ArcGIS</a>',
        url: 'https://services.arcgisonline.com/arcgis/rest/' +
            'services/Demographics/USA_Population_Density/MapServer/WMTS/',
        layer: '0',
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        projection: projection,
        tileGrid: new WMTSTileGrid({
          origin: _ol_extent_.getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true
      })
    })
  ],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new View({
    center: [-11158582, 4813697],
    zoom: 4
  })
});
