import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {defaults as defaultInteractions, Modify} from '../src/ol/interaction.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {shiftKeyOnly} from '../src/ol/events/condition.js';
import Collection from '../src/ol/Collection.js';
import Style from '../src/ol/style/Style.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';


const raster = new TileLayer({
  source: new OSM()
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON(),
    wrapX: false
  })
});

const features = new Collection();

// style features in collection

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

const modify = new Modify({
  features: features
});

const map = new Map({
  interactions: defaultInteractions().extend([modify]),
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
