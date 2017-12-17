import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import {get as getProjection} from '../src/ol/proj.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_WMTS_ from '../src/ol/source/WMTS.js';
import _ol_tilegrid_WMTS_ from '../src/ol/tilegrid/WMTS.js';


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

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_(),
      opacity: 0.7
    }),
    new _ol_layer_Tile_({
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
        tileGrid: new _ol_tilegrid_WMTS_({
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
  view: new _ol_View_({
    center: [-11158582, 4813697],
    zoom: 4
  })
});
