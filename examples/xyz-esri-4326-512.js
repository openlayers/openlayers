import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';

// The tile size supported by the ArcGIS tile service.
var tileSize = 512;

var urlTemplate = 'https://services.arcgisonline.com/arcgis/rest/services/' +
    'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';

var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new _ol_source_XYZ_({
        attributions: 'Copyright:© 2013 ESRI, i-cubed, GeoEye',
        maxZoom: 16,
        projection: 'EPSG:4326',
        tileSize: tileSize,
        tileUrlFunction: function(tileCoord) {
          return urlTemplate.replace('{z}', (tileCoord[0] - 1).toString())
              .replace('{x}', tileCoord[1].toString())
              .replace('{y}', (-tileCoord[2] - 1).toString());
        },
        wrapX: true
      })
    })
  ],
  view: new _ol_View_({
    center: [0, 0],
    projection: 'EPSG:4326',
    zoom: 2,
    minZoom: 2
  })
});
