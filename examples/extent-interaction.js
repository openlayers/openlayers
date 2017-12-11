import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_events_condition_ from '../src/ol/events/condition.js';
import _ol_format_GeoJSON_ from '../src/ol/format/GeoJSON.js';
import _ol_interaction_Extent_ from '../src/ol/interaction/Extent.js';
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

var extent = new _ol_interaction_Extent_({
  condition: _ol_events_condition_.platformModifierKeyOnly
});
map.addInteraction(extent);
extent.setActive(false);

//Enable interaction by holding shift
this.addEventListener('keydown', function(event) {
  if (event.keyCode == 16) {
    extent.setActive(true);
  }
});
this.addEventListener('keyup', function(event) {
  if (event.keyCode == 16) {
    extent.setActive(false);
  }
});
