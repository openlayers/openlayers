// NOCOMPILE
// this example uses turf.js for which we don't have an externs file.
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
  var features = format.readFeatures(json);
  var street = features[0];

  // convert to a turf.js feature
  var turfLine = format.writeFeatureObject(street);

  // show a marker every 200 meters
  var distance = 0.2;

  // get the line length in kilometers
  var length = turf.lineDistance(turfLine, 'kilometers');
  for (var i = 1; i <= length / distance; i++) {
    var turfPoint = turf.along(turfLine, i * distance, 'kilometers');

    // convert the generated point to a OpenLayers feature
    var marker = format.readFeature(turfPoint);
    marker.getGeometry().transform('EPSG:4326', 'EPSG:3857');
    source.addFeature(marker);
  }

  street.getGeometry().transform('EPSG:4326', 'EPSG:3857');
  source.addFeature(street);
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
    center: _ol_proj_.fromLonLat([126.980366, 37.526540]),
    zoom: 15
  })
});
