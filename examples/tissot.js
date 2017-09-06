import _ol_Feature_ from '../src/ol/feature';
import _ol_Map_ from '../src/ol/map';
import _ol_Sphere_ from '../src/ol/sphere';
import _ol_View_ from '../src/ol/view';
import _ol_geom_Polygon_ from '../src/ol/geom/polygon';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_TileWMS_ from '../src/ol/source/tilewms';
import _ol_source_Vector_ from '../src/ol/source/vector';

var vectorLayer4326 = new _ol_layer_Vector_({
  source: new _ol_source_Vector_()
});

var vectorLayer3857 = new _ol_layer_Vector_({
  source: new _ol_source_Vector_()
});

var map4326 = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
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

var map3857 = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
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

var wgs84Sphere = new _ol_Sphere_(6378137);

var radius = 800000;
var x, y;
for (x = -180; x < 180; x += 30) {
  for (y = -90; y < 90; y += 30) {
    var circle4326 = _ol_geom_Polygon_.circular(wgs84Sphere, [x, y], radius, 64);
    var circle3857 = circle4326.clone().transform('EPSG:4326', 'EPSG:3857');
    vectorLayer4326.getSource().addFeature(new _ol_Feature_(circle4326));
    vectorLayer3857.getSource().addFeature(new _ol_Feature_(circle3857));
  }
}
