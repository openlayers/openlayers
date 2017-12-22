import _ol_Feature_ from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {circular as circularPolygon} from '../src/ol/geom/Polygon.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';

var vectorLayer4326 = new _ol_layer_Vector_({
  source: new _ol_source_Vector_()
});

var vectorLayer3857 = new _ol_layer_Vector_({
  source: new _ol_source_Vector_()
});

var map4326 = new Map({
  layers: [
    new TileLayer({
      source: new _ol_source_TileWMS_({
        url: 'https://ahocevar.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
          'TILED': true
        }
      })
    }),
    vectorLayer4326
  ],
  target: 'map4326',
  view: new _ol_View_({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});

var map3857 = new Map({
  layers: [
    new TileLayer({
      source: new _ol_source_TileWMS_({
        url: 'https://ahocevar.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
          'TILED': true
        }
      })
    }),
    vectorLayer3857
  ],
  target: 'map3857',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

var radius = 800000;
var x, y;
for (x = -180; x < 180; x += 30) {
  for (y = -90; y < 90; y += 30) {
    var circle4326 = circularPolygon([x, y], radius, 64);
    var circle3857 = circle4326.clone().transform('EPSG:4326', 'EPSG:3857');
    vectorLayer4326.getSource().addFeature(new _ol_Feature_(circle4326));
    vectorLayer3857.getSource().addFeature(new _ol_Feature_(circle3857));
  }
}
