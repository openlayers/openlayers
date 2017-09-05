import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_KML_ from '../src/ol/format/kml';
import _ol_layer_Heatmap_ from '../src/ol/layer/heatmap';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_Stamen_ from '../src/ol/source/stamen';
import _ol_source_Vector_ from '../src/ol/source/vector';

var blur = document.getElementById('blur');
var radius = document.getElementById('radius');

var vector = new _ol_layer_Heatmap_({
  source: new _ol_source_Vector_({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new _ol_format_KML_({
      extractStyles: false
    })
  }),
  blur: parseInt(blur.value, 10),
  radius: parseInt(radius.value, 10)
});

vector.getSource().on('addfeature', function(event) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  var name = event.feature.get('name');
  var magnitude = parseFloat(name.substr(2));
  event.feature.set('weight', magnitude - 5);
});

var raster = new _ol_layer_Tile_({
  source: new _ol_source_Stamen_({
    layer: 'toner'
  })
});

var map = new _ol_Map_({
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});


blur.addEventListener('input', function() {
  vector.setBlur(parseInt(blur.value, 10));
});

radius.addEventListener('input', function() {
  vector.setRadius(parseInt(radius.value, 10));
});
