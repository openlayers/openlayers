// NOCOMPILE
// this example uses JSTS for which we don't have an externs file.
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';


var source = new _ol_source_Vector_();
fetch('data/geojson/roads-seoul.geojson').then(function(response) {
  return response.json();
}).then(function(json) {
  var format = new _ol_format_GeoJSON_();
  var features = format.readFeatures(json, {featureProjection: 'EPSG:3857'});

  var parser = new jsts.io.OL3Parser();

  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    // convert the OpenLayers geometry to a JSTS geometry
    var jstsGeom = parser.read(feature.getGeometry());

    // create a buffer of 40 meters around each line
    var buffered = jstsGeom.buffer(40);

    // convert back from JSTS and replace the geometry on the feature
    feature.setGeometry(parser.write(buffered));
  }

  source.addFeatures(features);
});
var vectorLayer = new _ol_layer_Vector_({
  source: source
});

var rasterLayer = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var map = new _ol_Map_({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([126.979293, 37.528787]),
    zoom: 15
  })
});
