// NOCOMPILE
// this example uses JSTS for which we don't have an externs file.
import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';


var source = new _ol_source_Vector_();
fetch('data/geojson/roads-seoul.geojson').then(function(response) {
  return response.json();
}).then(function(json) {
  var format = new GeoJSON();
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

var rasterLayer = new TileLayer({
  source: new _ol_source_OSM_()
});

var map = new _ol_Map_({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new _ol_View_({
    center: fromLonLat([126.979293, 37.528787]),
    zoom: 15
  })
});
