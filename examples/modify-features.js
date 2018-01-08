import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {defaults as defaultInteractions} from '../src/ol/interaction.js';
import _ol_interaction_Modify_ from '../src/ol/interaction/Modify.js';
import _ol_interaction_Select_ from '../src/ol/interaction/Select.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';


var raster = new TileLayer({
  source: new OSM()
});

var vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON(),
    wrapX: false
  })
});

var select = new _ol_interaction_Select_({
  wrapX: false
});

var modify = new _ol_interaction_Modify_({
  features: select.getFeatures()
});

var map = new Map({
  interactions: defaultInteractions().extend([select, modify]),
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
