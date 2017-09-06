import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_events_condition_ from '../src/ol/events/condition';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_interaction_Extent_ from '../src/ol/interaction/extent';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';

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
