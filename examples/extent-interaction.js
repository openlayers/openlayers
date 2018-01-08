import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import _ol_events_condition_ from '../src/ol/events/condition.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import _ol_interaction_Extent_ from '../src/ol/interaction/Extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';

var vectorSource = new _ol_source_Vector_({
  url: 'data/geojson/countries.geojson',
  format: new GeoJSON()
});

var map = new Map({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    }),
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
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
