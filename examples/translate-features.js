import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_interaction_ from '../src/ol/interaction';
import _ol_interaction_Select_ from '../src/ol/interaction/select';
import _ol_interaction_Translate_ from '../src/ol/interaction/translate';
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

var select = new _ol_interaction_Select_();

var translate = new _ol_interaction_Translate_({
  features: select.getFeatures()
});

var map = new _ol_Map_({
  interactions: _ol_interaction_.defaults().extend([select, translate]),
  layers: [raster, vector],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});
