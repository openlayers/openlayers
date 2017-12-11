import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_events_condition_ from '../src/ol/events/condition.js';
import _ol_format_GeoJSON_ from '../src/ol/format/GeoJSON.js';
import _ol_interaction_DragBox_ from '../src/ol/interaction/DragBox.js';
import _ol_interaction_Select_ from '../src/ol/interaction/Select.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';


var vectorSource = new _ol_source_Vector_({
  url: 'data/geojson/countries.geojson',
  format: new _ol_format_GeoJSON_()
});


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    new _ol_layer_Vector_({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});

// a normal select interaction to handle click
var select = new _ol_interaction_Select_();
map.addInteraction(select);

var selectedFeatures = select.getFeatures();

// a DragBox interaction used to select features by drawing boxes
var dragBox = new _ol_interaction_DragBox_({
  condition: _ol_events_condition_.platformModifierKeyOnly
});

map.addInteraction(dragBox);

dragBox.on('boxend', function() {
  // features that intersect the box are added to the collection of
  // selected features
  var extent = dragBox.getGeometry().getExtent();
  vectorSource.forEachFeatureIntersectingExtent(extent, function(feature) {
    selectedFeatures.push(feature);
  });
});

// clear selection when drawing a new box and when clicking on the map
dragBox.on('boxstart', function() {
  selectedFeatures.clear();
});

var infoBox = document.getElementById('info');

selectedFeatures.on(['add', 'remove'], function() {
  var names = selectedFeatures.getArray().map(function(feature) {
    return feature.get('name');
  });
  if (names.length > 0) {
    infoBox.innerHTML = names.join(', ');
  } else {
    infoBox.innerHTML = 'No countries selected';
  }
});
