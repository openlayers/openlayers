import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_events_condition_ from '../src/ol/events/condition';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_interaction_Select_ from '../src/ol/interaction/select';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_Vector_ from '../src/ol/source/vector';

var raster = new _ol_layer_Tile_({
  source: new _ol_source_OSM_()
});

var vector = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/countries.geojson',
    format: new _ol_format_GeoJSON_()
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

var select = null;  // ref to currently selected interaction

// select interaction working on "singleclick"
var selectSingleClick = new _ol_interaction_Select_();

// select interaction working on "click"
var selectClick = new _ol_interaction_Select_({
  condition: _ol_events_condition_.click
});

// select interaction working on "pointermove"
var selectPointerMove = new _ol_interaction_Select_({
  condition: _ol_events_condition_.pointerMove
});

var selectAltClick = new _ol_interaction_Select_({
  condition: function(mapBrowserEvent) {
    return _ol_events_condition_.click(mapBrowserEvent) &&
        _ol_events_condition_.altKeyOnly(mapBrowserEvent);
  }
});

var selectElement = document.getElementById('type');

var changeInteraction = function() {
  if (select !== null) {
    map.removeInteraction(select);
  }
  var value = selectElement.value;
  if (value == 'singleclick') {
    select = selectSingleClick;
  } else if (value == 'click') {
    select = selectClick;
  } else if (value == 'pointermove') {
    select = selectPointerMove;
  } else if (value == 'altclick') {
    select = selectAltClick;
  } else {
    select = null;
  }
  if (select !== null) {
    map.addInteraction(select);
    select.on('select', function(e) {
      document.getElementById('status').innerHTML = '&nbsp;' +
          e.target.getFeatures().getLength() +
          ' selected features (last operation selected ' + e.selected.length +
          ' and deselected ' + e.deselected.length + ' features)';
    });
  }
};


/**
 * onchange callback on the select element.
 */
selectElement.onchange = changeInteraction;
changeInteraction();
