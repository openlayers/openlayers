import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {defaults as defaultInteractions} from '../src/ol/interaction.js';
import _ol_interaction_Select_ from '../src/ol/interaction/Select.js';
import _ol_interaction_Translate_ from '../src/ol/interaction/Translate.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';


var raster = new TileLayer({
  source: new _ol_source_OSM_()
});

var vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  })
});

var select = new _ol_interaction_Select_();

var translate = new _ol_interaction_Translate_({
  features: select.getFeatures()
});

var map = new Map({
  interactions: defaultInteractions().extend([select, translate]),
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
