import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {defaults as defaultInteractions, Translate} from '../src/ol/interaction.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import Collection from '../src/ol/Collection.js';
import Style from '../src/ol/style/Style.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import {shiftKeyOnly} from '../src/ol/events/condition.js';


const raster = new TileLayer({
  source: new OSM()
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  })
});

const features = new Collection();

const highlightStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.7)'
  }),
  stroke: new Stroke({
    color: 'rgb(51,153,204)',
    width: 3
  })
});

features.on('add', function(e) {
  e.element.setStyle(highlightStyle);
});

features.on('remove', function(e) {
  e.element.setStyle(undefined);
});

const translate = new Translate({
  features: features
});

const map = new Map({
  interactions: defaultInteractions().extend([translate]),
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

map.on('singleclick', function(e) {
  if (!shiftKeyOnly(e)) {
    features.clear();
  }
  map.forEachFeatureAtPixel(e.pixel, function(f) {
    features.push(f);
  });
});
