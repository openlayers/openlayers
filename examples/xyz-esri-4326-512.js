import _ol_Attribution_ from '../src/ol/attribution';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_XYZ_ from '../src/ol/source/xyz';

var attribution = new _ol_Attribution_({
  html: 'Copyright:© 2013 ESRI, i-cubed, GeoEye'
});

var projection = _ol_proj_.get('EPSG:4326');

// The tile size supported by the ArcGIS tile service.
var tileSize = 512;

var urlTemplate = 'https://services.arcgisonline.com/arcgis/rest/services/' +
    'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';

var map = new _ol_Map_({
  target: 'map',
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_XYZ_({
        attributions: [attribution],
        maxZoom: 16,
        projection: projection,
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
    projection: projection,
    zoom: 2,
    minZoom: 2
  })
});
